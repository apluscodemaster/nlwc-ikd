<?php
/**
 * Plugin Name: NLWC Sermons API
 * Description: Custom REST API endpoint to expose Series Engine audio messages data.
 * Version: 1.4.0
 * Author: NLWC Dev Team
 *
 * Upload to: wp-content/mu-plugins/nlwc-sermons-api.php
 *
 * Database Schema (Series Engine tables, prefix: ikorodu_se_):
 *   ikorodu_se_messages                — 506 messages: title, speaker, date, audio_url, etc.
 *   ikorodu_se_series                  — 23 series: s_title, s_description
 *   ikorodu_se_speakers                — 32 speakers: first_name, last_name
 *   ikorodu_se_topics                  — 200 topics: name
 *   ikorodu_se_series_message_matches  — message↔series junction (many-to-many)
 *   ikorodu_se_message_speaker_matches — message↔speaker junction (many-to-many)
 *   ikorodu_se_message_topic_matches   — message↔topic junction (many-to-many)
 *
 * Endpoints (static routes registered before dynamic to avoid conflicts):
 *   GET /wp-json/nlwc/v1/sermons          — Paginated list of audio messages
 *                                           (?slug=<slug> returns the single
 *                                           message whose sanitize_title(title)
 *                                           equals <slug>, for legacy redirects)
 *   GET /wp-json/nlwc/v1/sermons/series   — List of all series
 *   GET /wp-json/nlwc/v1/sermons/speakers — List of all speakers
 *   GET /wp-json/nlwc/v1/sermons/topics   — List of all topics
 *   GET /wp-json/nlwc/v1/sermons/<id>     — Single message with full details
 *   PUT /wp-json/nlwc/v1/sermons/<id>     — Update a message (requires auth)
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class NLWC_Sermons_API {

    /** Maximum allowed per_page value. */
    const MAX_PER_PAGE = 50;

    /** Cache TTL in seconds (1 hour). */
    const CACHE_TTL = 3600;

    /**
     * Return Series Engine table names using the WP table prefix ('ikorodu_').
     *
     * @return array<string, string>
     */
    private static function tables(): array {
        global $wpdb;
        $p = $wpdb->prefix; // 'ikorodu_'
        return [
            'messages'        => "{$p}se_messages",
            'series'          => "{$p}se_series",
            'speakers'        => "{$p}se_speakers",
            'topics'          => "{$p}se_topics",
            'series_matches'  => "{$p}se_series_message_matches",
            'speaker_matches' => "{$p}se_message_speaker_matches",
            'topic_matches'   => "{$p}se_message_topic_matches",
        ];
    }

    /**
     * Register all REST API routes.
     *
     * IMPORTANT: Static routes (/series, /speakers, /topics) are registered
     * BEFORE the dynamic /(?P<id>\d+) route so WordPress evaluates them first
     * and there is no ambiguity in route matching.
     *
     * The GET and PUT handlers for /sermons/<id> share the same URL pattern but
     * are registered as separate route definitions — WordPress resolves them by
     * HTTP method, so there is no conflict.
     */
    public static function register_routes(): void {
        $ns = 'nlwc/v1';

        // ── Static routes first ──────────────────────────────────────────

        // GET /sermons — Paginated list
        register_rest_route( $ns, '/sermons', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_sermons' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'page'       => [ 'default' => 1,  'sanitize_callback' => 'absint' ],
                'per_page'   => [ 'default' => 10, 'sanitize_callback' => 'absint' ],
                'search'     => [ 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ],
                'slug'       => [ 'default' => '', 'sanitize_callback' => 'sanitize_title' ],
                'series_id'  => [ 'default' => 0,  'sanitize_callback' => 'absint' ],
                'speaker_id' => [ 'default' => 0,  'sanitize_callback' => 'absint' ],
                'topic_id'   => [ 'default' => 0,  'sanitize_callback' => 'absint' ],
                'year'       => [ 'default' => 0,  'sanitize_callback' => 'absint' ],
                'order'      => [
                    'default'           => 'DESC',
                    'sanitize_callback' => 'sanitize_text_field',
                    // Reject anything that is not ASC or DESC with a 400 rather
                    // than silently falling back to the default.
                    'validate_callback' => function ( $value ) {
                        return in_array( strtoupper( $value ), [ 'ASC', 'DESC' ], true );
                    },
                ],
            ],
        ] );

        // GET /sermons/series — All series
        register_rest_route( $ns, '/sermons/series', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_series' ],
            'permission_callback' => '__return_true',
        ] );

        // GET /sermons/speakers — All speakers
        register_rest_route( $ns, '/sermons/speakers', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_speakers' ],
            'permission_callback' => '__return_true',
        ] );

        // GET /sermons/topics — All topics
        register_rest_route( $ns, '/sermons/topics', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_topics' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Dynamic routes last ──────────────────────────────────────────

        // GET /sermons/<id> — Single message (public)
        register_rest_route( $ns, '/sermons/(?P<id>\d+)', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_sermon' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [
                    'required'          => true,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ] );

        // PUT /sermons/<id> — Update a message (requires auth)
        // Registered on the same pattern as GET above; WordPress dispatches by
        // HTTP method so both definitions coexist without conflict.
        register_rest_route( $ns, '/sermons/(?P<id>\d+)', [
            'methods'             => WP_REST_Server::EDITABLE, // PUT + PATCH
            'callback'            => [ __CLASS__, 'update_sermon' ],
            'permission_callback' => function ( WP_REST_Request $request ) {
                // Accept either a logged-in WP admin or a valid Application Password.
                return current_user_can( 'edit_posts' ) || self::verify_app_password( $request );
            },
            'args'                => [
                'id' => [
                    'required'          => true,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ] );
    }

    /* =====================================================================
     *  Helpers
     * ===================================================================== */

    /**
     * Attach standard cache and CORS headers to a REST response.
     */
    private static function with_headers( WP_REST_Response $response ): WP_REST_Response {
        $response->header( 'Cache-Control', 'public, max-age=' . self::CACHE_TTL );
        $response->header( 'Access-Control-Allow-Origin', '*' );
        return $response;
    }

    /**
     * Return a 500 response and write the DB error to the WP error log.
     */
    private static function db_error( string $context ): WP_REST_Response {
        global $wpdb;
        error_log( "[NLWC Sermons API] DB error in {$context}: " . $wpdb->last_error );
        return new WP_REST_Response(
            [ 'error' => 'Database query failed', 'message' => $wpdb->last_error ],
            500
        );
    }

    /**
     * Normalise a video_url value — returns null when the field is absent or '0'.
     */
    private static function video_url( ?string $value ): ?string {
        return ( $value && $value !== '0' ) ? $value : null;
    }

    /**
     * Format a raw DB row from the messages table into the standard API shape.
     * Shared between get_sermons() (list) and any other listing context.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function format_sermon_row( array $row ): array {
        return [
            'id'              => (int) $row['message_id'],
            'title'           => $row['title'],
            'slug'            => sanitize_title( $row['title'] ),
            'speaker'         => $row['speaker'],
            'date'            => $row['date'],
            'description'     => $row['description'],
            'duration'        => $row['message_length'],
            'thumbnail'       => $row['message_thumbnail'],
            'audioUrl'        => $row['audio_url'],
            'videoUrl'        => self::video_url( $row['video_url'] ),
            'audioFileSize'   => (int) $row['audio_file_size'],
            'audioPlayCount'  => (int) $row['audio_count'],
            'seriesId'        => (int) $row['primary_series'],
            'seriesTitle'     => $row['series_title'],
            'seriesThumbnail' => $row['series_thumbnail'],
            'focusScripture'  => $row['focus_scripture'],
        ];
    }

    /**
     * Verify a WP Application Password supplied via the Authorization: Basic header.
     *
     * WordPress's own `wp_authenticate_application_password()` handles the
     * credential check; we just extract the credentials from the header and
     * delegate to it.
     *
     * @param WP_REST_Request $request
     * @return bool
     */
    private static function verify_app_password( WP_REST_Request $request ): bool {
        $auth = $request->get_header( 'Authorization' );
        if ( ! $auth || stripos( $auth, 'Basic ' ) !== 0 ) {
            return false;
        }

        $decoded = base64_decode( substr( $auth, 6 ) );
        if ( ! $decoded || strpos( $decoded, ':' ) === false ) {
            return false;
        }

        [ $user_login, $password ] = explode( ':', $decoded, 2 );
        $user = wp_authenticate_application_password( null, $user_login, $password );

        return $user && ! is_wp_error( $user );
    }

    /* =====================================================================
     *  GET /sermons — Paginated listing
     * ===================================================================== */
    public static function get_sermons( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $t = self::tables();

        $page       = max( 1, $request->get_param( 'page' ) );
        $per_page   = min( self::MAX_PER_PAGE, max( 1, $request->get_param( 'per_page' ) ) );
        $search     = $request->get_param( 'search' );
        $series_id  = $request->get_param( 'series_id' );
        $speaker_id = $request->get_param( 'speaker_id' );
        $topic_id   = $request->get_param( 'topic_id' );
        $year       = $request->get_param( 'year' );
        $order      = strtoupper( $request->get_param( 'order' ) ) === 'ASC' ? 'ASC' : 'DESC';
        $offset     = ( $page - 1 ) * $per_page;

        // ── Exact slug lookup ────────────────────────────────────────────
        // Resolve a public slug (sanitize_title of the title) back to its single
        // message so legacy /messages/<slug> permalinks can 301 to
        // /sermons/audio/<id>. Short-circuits the normal listing logic below.
        $slug = $request->get_param( 'slug' );
        if ( ! empty( $slug ) ) {
            return self::with_headers( self::get_sermon_by_slug( $slug ) );
        }

        // ── Build query parts ────────────────────────────────────────────

        $where        = [ '1=1' ];
        $joins        = [];
        $join_values  = [];
        $where_values = [];

        $search_active    = false;
        $relevance_select = '';
        $relevance_values = [];

        if ( ! empty( $search ) ) {
            $words = array_filter( preg_split( '/\s+/', trim( $search ) ) );

            if ( count( $words ) > 0 ) {
                $search_active   = true;
                $word_conditions = [];
                $relevance_cases = [];

                foreach ( $words as $word ) {
                    $like = '%' . $wpdb->esc_like( $word ) . '%';

                    // Search the denormalised m.speaker column AND the proper
                    // speakers table so results are reliable even when the two
                    // are slightly out of sync.
                    $word_conditions[]  = "(m.title LIKE %s OR m.speaker LIKE %s OR CONCAT(sp.first_name, ' ', sp.last_name) LIKE %s)";
                    $where_values[]     = $like;
                    $where_values[]     = $like;
                    $where_values[]     = $like;

                    // +1 relevance point per matching keyword
                    $relevance_cases[]  = "(CASE WHEN m.title LIKE %s OR m.speaker LIKE %s OR CONCAT(sp.first_name, ' ', sp.last_name) LIKE %s THEN 1 ELSE 0 END)";
                    $relevance_values[] = $like;
                    $relevance_values[] = $like;
                    $relevance_values[] = $like;
                }

                $where[]          = '(' . implode( ' OR ', $word_conditions ) . ')';
                $relevance_select = ', (' . implode( ' + ', $relevance_cases ) . ') AS search_relevance';

                // Join speakers so the name search above has data to work with.
                $joins[] = "LEFT JOIN {$t['speaker_matches']} AS search_msm ON m.message_id = search_msm.message_id"
                         . " LEFT JOIN {$t['speakers']} AS sp ON search_msm.speaker_id = sp.speaker_id";
            }
        }

        // Filter by series (junction table)
        if ( $series_id > 0 ) {
            $joins[]       = "INNER JOIN {$t['series_matches']} AS sm ON m.message_id = sm.message_id AND sm.series_id = %d";
            $join_values[] = $series_id;
        }

        // Filter by speaker (junction table)
        if ( $speaker_id > 0 ) {
            $joins[]       = "INNER JOIN {$t['speaker_matches']} AS msm ON m.message_id = msm.message_id AND msm.speaker_id = %d";
            $join_values[] = $speaker_id;
        }

        // Filter by topic (junction table)
        if ( $topic_id > 0 ) {
            $joins[]       = "INNER JOIN {$t['topic_matches']} AS mtm ON m.message_id = mtm.message_id AND mtm.topic_id = %d";
            $join_values[] = $topic_id;
        }

        // Filter by year
        if ( $year > 0 ) {
            $where[]        = 'YEAR(m.date) = %d';
            $where_values[] = $year;
        }

        $join_sql  = implode( ' ', $joins );
        $where_sql = implode( ' AND ', $where );

        // ── Count total (placeholder order: JOINs → WHERE) ───────────────
        $count_sql    = "SELECT COUNT(DISTINCT m.message_id) FROM {$t['messages']} AS m {$join_sql} WHERE {$where_sql}";
        $count_values = array_merge( $join_values, $where_values );

        $total = (int) $wpdb->get_var(
            empty( $count_values ) ? $count_sql : $wpdb->prepare( $count_sql, $count_values )
        );

        if ( $wpdb->last_error ) {
            return self::db_error( 'get_sermons count' );
        }

        // ── Fetch rows (placeholder order: relevance → JOINs → WHERE → LIMIT) ──
        $order_clause = $search_active
            ? "ORDER BY search_relevance DESC, m.date {$order}, m.message_id {$order}"
            : "ORDER BY m.date {$order}, m.message_id {$order}";

        $data_sql = "
            SELECT DISTINCT
                m.message_id,
                m.title,
                m.speaker,
                m.date,
                m.description,
                m.message_length,
                m.message_thumbnail,
                m.audio_url,
                m.video_url,
                m.audio_file_size,
                m.audio_count,
                m.primary_series,
                m.focus_scripture,
                s.s_title       AS series_title,
                s.thumbnail_url AS series_thumbnail
                {$relevance_select}
            FROM {$t['messages']} AS m
            LEFT JOIN {$t['series']} AS s ON m.primary_series = s.series_id
            {$join_sql}
            WHERE {$where_sql}
            {$order_clause}
            LIMIT %d OFFSET %d
        ";

        $query_values = array_merge(
            $search_active ? $relevance_values : [],
            $join_values,
            $where_values,
            [ $per_page, $offset ]
        );

        $results = $wpdb->get_results( $wpdb->prepare( $data_sql, $query_values ), ARRAY_A );

        if ( $wpdb->last_error ) {
            return self::db_error( 'get_sermons fetch' );
        }

        $sermons     = array_map( [ __CLASS__, 'format_sermon_row' ], $results ?: [] );
        $total_pages = $total > 0 ? (int) ceil( $total / $per_page ) : 0;

        return self::with_headers( new WP_REST_Response( [
            'data'       => $sermons,
            'pagination' => [
                'page'       => $page,
                'perPage'    => $per_page,   // reflects the actual (possibly capped) value
                'total'      => $total,
                'totalPages' => $total_pages,
            ],
        ], 200 ) );
    }

    /**
     * Resolve a public slug (sanitize_title of the title) to a single message.
     * Returns the standard { data, pagination } envelope with 0 or 1 result.
     *
     * The slug is sanitize_title(title), which can't be reproduced in SQL, so we
     * scan the (small) id+title set and compare in PHP. Cached for an hour by the
     * with_headers() wrapper applied at the call site.
     */
    private static function get_sermon_by_slug( string $slug ): WP_REST_Response {
        global $wpdb;
        $t = self::tables();

        $rows = $wpdb->get_results( "SELECT message_id, title FROM {$t['messages']}", ARRAY_A );
        if ( $wpdb->last_error ) {
            return self::db_error( 'get_sermon_by_slug scan' );
        }

        $match_id = 0;
        foreach ( $rows ?: [] as $r ) {
            if ( sanitize_title( $r['title'] ) === $slug ) {
                $match_id = (int) $r['message_id'];
                break;
            }
        }

        $sermons = [];
        if ( $match_id > 0 ) {
            $row = $wpdb->get_row( $wpdb->prepare( "
                SELECT
                    m.message_id, m.title, m.speaker, m.date, m.description,
                    m.message_length, m.message_thumbnail, m.audio_url, m.video_url,
                    m.audio_file_size, m.audio_count, m.primary_series, m.focus_scripture,
                    s.s_title       AS series_title,
                    s.thumbnail_url AS series_thumbnail
                FROM {$t['messages']} AS m
                LEFT JOIN {$t['series']} AS s ON m.primary_series = s.series_id
                WHERE m.message_id = %d
            ", $match_id ), ARRAY_A );

            if ( $row ) {
                $sermons[] = self::format_sermon_row( $row );
            }
        }

        return new WP_REST_Response( [
            'data'       => $sermons,
            'pagination' => [
                'page'       => 1,
                'perPage'    => 1,
                'total'      => count( $sermons ),
                'totalPages' => count( $sermons ) > 0 ? 1 : 0,
            ],
        ], 200 );
    }

    /* =====================================================================
     *  GET /sermons/<id> — Single sermon with all details
     * ===================================================================== */
    public static function get_sermon( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $t  = self::tables();
        $id = $request->get_param( 'id' );

        // Fetch the message with its primary series in one query
        $row = $wpdb->get_row( $wpdb->prepare( "
            SELECT
                m.*,
                s.s_title       AS series_title,
                s.s_description AS series_description,
                s.thumbnail_url AS series_thumbnail
            FROM {$t['messages']} AS m
            LEFT JOIN {$t['series']} AS s ON m.primary_series = s.series_id
            WHERE m.message_id = %d
        ", $id ), ARRAY_A );

        if ( ! $row ) {
            return new WP_REST_Response( [ 'error' => 'Sermon not found' ], 404 );
        }

        // All series this message belongs to (via junction table)
        $all_series = $wpdb->get_results( $wpdb->prepare( "
            SELECT s.series_id, s.s_title, s.thumbnail_url
            FROM {$t['series_matches']} AS sm
            INNER JOIN {$t['series']} AS s ON sm.series_id = s.series_id
            WHERE sm.message_id = %d
        ", $id ), ARRAY_A );

        // All speakers (from the normalised speakers table, not the denormalised column)
        $speakers = $wpdb->get_results( $wpdb->prepare( "
            SELECT sp.speaker_id, sp.first_name, sp.last_name
            FROM {$t['speaker_matches']} AS msm
            INNER JOIN {$t['speakers']} AS sp ON msm.speaker_id = sp.speaker_id
            WHERE msm.message_id = %d
        ", $id ), ARRAY_A );

        // All topics for this message
        $topics = $wpdb->get_results( $wpdb->prepare( "
            SELECT t.topic_id, t.name
            FROM {$t['topic_matches']} AS mtm
            INNER JOIN {$t['topics']} AS t ON mtm.topic_id = t.topic_id
            WHERE mtm.message_id = %d
        ", $id ), ARRAY_A );

        // ── Increment play count then re-read the authoritative DB value ─
        // The old approach (read → increment → return old + 1) produced wrong
        // results under concurrent requests. We now let the DB do the maths
        // atomically, then fetch the real figure.
        $wpdb->query( $wpdb->prepare(
            "UPDATE {$t['messages']} SET audio_count = audio_count + 1 WHERE message_id = %d",
            $id
        ) );

        $play_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT audio_count FROM {$t['messages']} WHERE message_id = %d",
            $id
        ) );

        return self::with_headers( new WP_REST_Response( [
            'id'                => (int) $row['message_id'],
            'title'             => $row['title'],
            'slug'              => sanitize_title( $row['title'] ),
            'speaker'           => $row['speaker'],
            'date'              => $row['date'],
            'description'       => $row['description'],
            'duration'          => $row['message_length'],
            'thumbnail'         => $row['message_thumbnail'],
            'audioUrl'          => $row['audio_url'],
            'videoUrl'          => self::video_url( $row['video_url'] ),
            'audioFileSize'     => (int) $row['audio_file_size'],
            'audioPlayCount'    => $play_count,
            'focusScripture'    => $row['focus_scripture'],
            'seriesId'          => (int) $row['primary_series'],
            'seriesTitle'       => $row['series_title'],
            'seriesDescription' => $row['series_description'],
            'seriesThumbnail'   => $row['series_thumbnail'],
            'allSeries'         => array_map( static function ( $s ) {
                return [
                    'id'        => (int) $s['series_id'],
                    'title'     => $s['s_title'],
                    'thumbnail' => $s['thumbnail_url'],
                ];
            }, $all_series ?: [] ),
            'speakers'          => array_map( static function ( $sp ) {
                return [
                    'id'   => (int) $sp['speaker_id'],
                    'name' => trim( $sp['first_name'] . ' ' . $sp['last_name'] ),
                ];
            }, $speakers ?: [] ),
            'topics'            => array_map( static function ( $t ) {
                return [
                    'id'   => (int) $t['topic_id'],
                    'name' => $t['name'],
                ];
            }, $topics ?: [] ),
        ], 200 ) );
    }

    /* =====================================================================
     *  PUT /sermons/<id> — Update a Series Engine message (auth required)
     * ===================================================================== */
    public static function update_sermon( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $t  = self::tables();
        $id = $request->get_param( 'id' );

        // Verify the message exists before attempting any writes
        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT message_id FROM {$t['messages']} WHERE message_id = %d",
            $id
        ) );

        if ( ! $exists ) {
            return new WP_REST_Response( [ 'error' => 'Sermon not found' ], 404 );
        }

        // ── Build the update set from whichever fields were supplied ─────
        $update = [];
        $format = [];
        $body   = $request->get_json_params();

        if ( isset( $body['title'] ) && $body['title'] !== '' ) {
            $update['title'] = sanitize_text_field( $body['title'] );
            $format[]        = '%s';
        }
        if ( isset( $body['description'] ) ) {
            $update['description'] = wp_kses_post( $body['description'] );
            $format[]              = '%s';
        }
        if ( isset( $body['date'] ) ) {
            $update['date'] = sanitize_text_field( $body['date'] );
            $format[]       = '%s';
        }
        if ( isset( $body['audio_url'] ) ) {
            $update['audio_url'] = esc_url_raw( $body['audio_url'] );
            $format[]            = '%s';
        }
        if ( isset( $body['video_url'] ) ) {
            $update['video_url'] = esc_url_raw( $body['video_url'] );
            $format[]            = '%s';
        }
        if ( isset( $body['message_thumbnail'] ) ) {
            $update['message_thumbnail'] = esc_url_raw( $body['message_thumbnail'] );
            $format[]                    = '%s';
        }
        if ( isset( $body['focus_scripture'] ) ) {
            $update['focus_scripture'] = sanitize_text_field( $body['focus_scripture'] );
            $format[]                  = '%s';
        }
        if ( isset( $body['speaker'] ) ) {
            $update['speaker'] = sanitize_text_field( $body['speaker'] );
            $format[]          = '%s';
        }
        if ( isset( $body['message_length'] ) ) {
            $update['message_length'] = sanitize_text_field( $body['message_length'] );
            $format[]                 = '%s';
        }

        if ( empty( $update ) && ! isset( $body['series_id'] ) ) {
            return new WP_REST_Response( [ 'error' => 'No fields to update' ], 400 );
        }

        // Only run the main UPDATE when there are column changes to apply
        if ( ! empty( $update ) ) {
            $result = $wpdb->update(
                $t['messages'],
                $update,
                [ 'message_id' => $id ],
                $format,
                [ '%d' ]
            );

            if ( $result === false ) {
                return self::db_error( 'update_sermon' );
            }
        }

        // ── Re-assign series if requested ────────────────────────────────
        // Updates both the denormalised primary_series column on the message
        // and the junction table (remove old entry, insert new one).
        if ( isset( $body['series_id'] ) ) {
            $series_id = absint( $body['series_id'] );

            $wpdb->update(
                $t['messages'],
                [ 'primary_series' => $series_id ],
                [ 'message_id'     => $id ],
                [ '%d' ],
                [ '%d' ]
            );

            // Replace the junction-table row entirely
            $wpdb->delete( $t['series_matches'], [ 'message_id' => $id ], [ '%d' ] );

            if ( $series_id > 0 ) {
                $wpdb->insert(
                    $t['series_matches'],
                    [ 'message_id' => $id, 'series_id' => $series_id ],
                    [ '%d', '%d' ]
                );
            }
        }

        return new WP_REST_Response( [ 'success' => true, 'id' => (int) $id ], 200 );
    }

    /* =====================================================================
     *  GET /sermons/series — All series with message counts
     * ===================================================================== */
    public static function get_series( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $t = self::tables();

        $results = $wpdb->get_results( "
            SELECT
                s.series_id,
                s.s_title,
                s.s_description,
                s.thumbnail_url,
                s.start_date,
                s.archived,
                COUNT(sm.message_id) AS message_count
            FROM {$t['series']} AS s
            LEFT JOIN {$t['series_matches']} AS sm ON s.series_id = sm.series_id
            GROUP BY s.series_id
            ORDER BY s.start_date DESC
        ", ARRAY_A );

        if ( $wpdb->last_error ) {
            return self::db_error( 'get_series' );
        }

        $series = array_map( static function ( $row ) {
            return [
                'id'           => (int) $row['series_id'],
                'title'        => $row['s_title'],
                'description'  => $row['s_description'],
                'thumbnail'    => $row['thumbnail_url'],
                'startDate'    => $row['start_date'],
                'archived'     => $row['archived'] === '1',
                'messageCount' => (int) $row['message_count'],
            ];
        }, $results ?: [] );

        return self::with_headers( new WP_REST_Response( $series, 200 ) );
    }

    /* =====================================================================
     *  GET /sermons/speakers — All speakers with message counts
     * ===================================================================== */
    public static function get_speakers( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $t = self::tables();

        $results = $wpdb->get_results( "
            SELECT
                sp.speaker_id,
                sp.first_name,
                sp.last_name,
                COUNT(msm.message_id) AS message_count
            FROM {$t['speakers']} AS sp
            LEFT JOIN {$t['speaker_matches']} AS msm ON sp.speaker_id = msm.speaker_id
            GROUP BY sp.speaker_id
            ORDER BY sp.last_name ASC, sp.first_name ASC
        ", ARRAY_A );

        if ( $wpdb->last_error ) {
            return self::db_error( 'get_speakers' );
        }

        $speakers = array_map( static function ( $row ) {
            return [
                'id'           => (int) $row['speaker_id'],
                'name'         => trim( $row['first_name'] . ' ' . $row['last_name'] ),
                'firstName'    => $row['first_name'],
                'lastName'     => $row['last_name'],
                'messageCount' => (int) $row['message_count'],
            ];
        }, $results ?: [] );

        return self::with_headers( new WP_REST_Response( $speakers, 200 ) );
    }

    /* =====================================================================
     *  GET /sermons/topics — All topics with message counts
     * ===================================================================== */
    public static function get_topics( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $t = self::tables();

        $results = $wpdb->get_results( "
            SELECT
                t.topic_id,
                t.name,
                COUNT(mtm.message_id) AS message_count
            FROM {$t['topics']} AS t
            LEFT JOIN {$t['topic_matches']} AS mtm ON t.topic_id = mtm.topic_id
            GROUP BY t.topic_id
            HAVING message_count > 0
            ORDER BY t.name ASC
        ", ARRAY_A );

        if ( $wpdb->last_error ) {
            return self::db_error( 'get_topics' );
        }

        $topics = array_map( static function ( $row ) {
            return [
                'id'           => (int) $row['topic_id'],
                'name'         => $row['name'],
                'messageCount' => (int) $row['message_count'],
            ];
        }, $results ?: [] );

        return self::with_headers( new WP_REST_Response( $topics, 200 ) );
    }
}

// Register routes on REST API init
add_action( 'rest_api_init', [ 'NLWC_Sermons_API', 'register_routes' ] );