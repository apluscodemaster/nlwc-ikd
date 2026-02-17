<?php
/**
 * Plugin Name: NLWC Sermons API
 * Description: Custom REST API endpoint to expose Series Engine audio messages data.
 * Version: 1.1.0
 * Author: NLWC Dev Team
 *
 * Upload to: wp-content/mu-plugins/nlwc-sermons-api.php
 *
 * Database Schema (Series Engine tables, prefix: ikorodu_se_):
 *   ikorodu_se_messages          — 506 messages with title, speaker, date, audio_url, etc.
 *   ikorodu_se_series            — 23 series with s_title, s_description
 *   ikorodu_se_speakers          — 32 speakers with first_name, last_name
 *   ikorodu_se_topics            — 200 topics with name
 *   ikorodu_se_series_message_matches  — message↔series junction (many-to-many)
 *   ikorodu_se_message_speaker_matches — message↔speaker junction (many-to-many)
 *   ikorodu_se_message_topic_matches   — message↔topic junction (many-to-many)
 *
 * Endpoints:
 *   GET /wp-json/nlwc/v1/sermons              — Paginated list of audio messages
 *   GET /wp-json/nlwc/v1/sermons/<id>         — Single message with full details
 *   GET /wp-json/nlwc/v1/sermons/series       — List of all series/categories
 *   GET /wp-json/nlwc/v1/sermons/speakers     — List of all speakers
 *   GET /wp-json/nlwc/v1/sermons/topics       — List of all topics
 */

if (!defined('ABSPATH')) {
    exit;
}

class NLWC_Sermons_API {

    /**
     * Get Series Engine table names using the WP prefix.
     * The prefix is 'ikorodu_' on this site.
     */
    private static function tables() {
        global $wpdb;
        $p = $wpdb->prefix; // 'ikorodu_'
        return array(
            'messages'         => $p . 'se_messages',
            'series'           => $p . 'se_series',
            'speakers'         => $p . 'se_speakers',
            'topics'           => $p . 'se_topics',
            'series_matches'   => $p . 'se_series_message_matches',
            'speaker_matches'  => $p . 'se_message_speaker_matches',
            'topic_matches'    => $p . 'se_message_topic_matches',
        );
    }

    /**
     * Register all REST API routes
     */
    public static function register_routes() {
        $ns = 'nlwc/v1';

        // GET /sermons — Paginated list
        register_rest_route($ns, '/sermons', array(
            'methods'             => 'GET',
            'callback'            => array(__CLASS__, 'get_sermons'),
            'permission_callback' => '__return_true',
            'args'                => array(
                'page' => array(
                    'default'           => 1,
                    'sanitize_callback' => 'absint',
                ),
                'per_page' => array(
                    'default'           => 10,
                    'sanitize_callback' => 'absint',
                ),
                'search' => array(
                    'default'           => '',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'series_id' => array(
                    'default'           => 0,
                    'sanitize_callback' => 'absint',
                ),
                'speaker_id' => array(
                    'default'           => 0,
                    'sanitize_callback' => 'absint',
                ),
                'topic_id' => array(
                    'default'           => 0,
                    'sanitize_callback' => 'absint',
                ),
                'year' => array(
                    'default'           => 0,
                    'sanitize_callback' => 'absint',
                ),
                'order' => array(
                    'default'           => 'DESC',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));

        // GET /sermons/<id> — Single message
        register_rest_route($ns, '/sermons/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array(__CLASS__, 'get_sermon'),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id' => array(
                    'required'          => true,
                    'sanitize_callback' => 'absint',
                ),
            ),
        ));

        // GET /sermons/series — All series
        register_rest_route($ns, '/sermons/series', array(
            'methods'             => 'GET',
            'callback'            => array(__CLASS__, 'get_series'),
            'permission_callback' => '__return_true',
        ));

        // GET /sermons/speakers — All speakers
        register_rest_route($ns, '/sermons/speakers', array(
            'methods'             => 'GET',
            'callback'            => array(__CLASS__, 'get_speakers'),
            'permission_callback' => '__return_true',
        ));

        // GET /sermons/topics — All topics
        register_rest_route($ns, '/sermons/topics', array(
            'methods'             => 'GET',
            'callback'            => array(__CLASS__, 'get_topics'),
            'permission_callback' => '__return_true',
        ));
    }

    /* =====================================================================
     *  GET /sermons — Paginated listing
     * ===================================================================== */
    public static function get_sermons($request) {
        global $wpdb;
        $t = self::tables();

        $page       = max(1, $request->get_param('page'));
        $per_page   = min(50, max(1, $request->get_param('per_page')));
        $search     = $request->get_param('search');
        $series_id  = $request->get_param('series_id');
        $speaker_id = $request->get_param('speaker_id');
        $topic_id   = $request->get_param('topic_id');
        $year       = $request->get_param('year');
        $order      = strtoupper($request->get_param('order')) === 'ASC' ? 'ASC' : 'DESC';
        $offset     = ($page - 1) * $per_page;

        // Build WHERE + JOINs
        $where  = array('1=1');
        $joins  = array();
        $values = array();

        // Search by title or speaker name
        if (!empty($search)) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where[]  = "(m.title LIKE %s OR m.speaker LIKE %s)";
            $values[] = $like;
            $values[] = $like;
        }

        // Filter by series (via junction table)
        if ($series_id > 0) {
            $joins[]  = "INNER JOIN {$t['series_matches']} AS sm ON m.message_id = sm.message_id AND sm.series_id = %d";
            $values[] = $series_id;
        }

        // Filter by speaker (via junction table)
        if ($speaker_id > 0) {
            $joins[]  = "INNER JOIN {$t['speaker_matches']} AS msm ON m.message_id = msm.message_id AND msm.speaker_id = %d";
            $values[] = $speaker_id;
        }

        // Filter by topic (via junction table)
        if ($topic_id > 0) {
            $joins[]  = "INNER JOIN {$t['topic_matches']} AS mtm ON m.message_id = mtm.message_id AND mtm.topic_id = %d";
            $values[] = $topic_id;
        }

        // Filter by year
        if ($year > 0) {
            $where[]  = "YEAR(m.date) = %d";
            $values[] = $year;
        }

        $join_sql  = implode(' ', $joins);
        $where_sql = implode(' AND ', $where);

        // ---- Count total ----
        $count_query = "SELECT COUNT(DISTINCT m.message_id) FROM {$t['messages']} AS m {$join_sql} WHERE {$where_sql}";
        if (!empty($values)) {
            $count_query = $wpdb->prepare($count_query, $values);
        }
        $total = (int) $wpdb->get_var($count_query);

        if ($wpdb->last_error) {
            return new WP_REST_Response(array(
                'error'   => 'Database query failed',
                'message' => $wpdb->last_error,
            ), 500);
        }

        // ---- Fetch rows ----
        // Left join series via primary_series column for the "main" series
        $data_query = "
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
            FROM {$t['messages']} AS m
            LEFT JOIN {$t['series']} AS s ON m.primary_series = s.series_id
            {$join_sql}
            WHERE {$where_sql}
            ORDER BY m.date {$order}, m.message_id {$order}
            LIMIT %d OFFSET %d
        ";

        $query_values = array_merge($values, array($per_page, $offset));
        $results = $wpdb->get_results($wpdb->prepare($data_query, $query_values), ARRAY_A);

        if ($wpdb->last_error) {
            return new WP_REST_Response(array(
                'error'   => 'Database query failed',
                'message' => $wpdb->last_error,
            ), 500);
        }

        // Format response
        $sermons = array_map(function ($row) {
            return array(
                'id'              => (int) $row['message_id'],
                'title'           => $row['title'],
                'slug'            => sanitize_title($row['title']),
                'speaker'         => $row['speaker'],
                'date'            => $row['date'],
                'description'     => $row['description'],
                'duration'        => $row['message_length'],
                'thumbnail'       => $row['message_thumbnail'],
                'audioUrl'        => $row['audio_url'],
                'videoUrl'        => ($row['video_url'] && $row['video_url'] !== '0') ? $row['video_url'] : null,
                'audioFileSize'   => (int) $row['audio_file_size'],
                'audioPlayCount'  => (int) $row['audio_count'],
                'seriesId'        => (int) $row['primary_series'],
                'seriesTitle'     => $row['series_title'],
                'seriesThumbnail' => $row['series_thumbnail'],
                'focusScripture'  => $row['focus_scripture'],
            );
        }, $results ?: array());

        $total_pages = $total > 0 ? (int) ceil($total / $per_page) : 0;

        $response = new WP_REST_Response(array(
            'data'       => $sermons,
            'pagination' => array(
                'page'       => $page,
                'perPage'    => $per_page,
                'total'      => $total,
                'totalPages' => $total_pages,
            ),
        ), 200);

        // Cache for 1 hour
        $response->header('Cache-Control', 'public, max-age=3600');
        // Allow cross-origin requests from the gallery app
        $response->header('Access-Control-Allow-Origin', '*');

        return $response;
    }

    /* =====================================================================
     *  GET /sermons/<id> — Single sermon with all details
     * ===================================================================== */
    public static function get_sermon($request) {
        global $wpdb;
        $t  = self::tables();
        $id = $request->get_param('id');

        // Get the message with its primary series
        $row = $wpdb->get_row($wpdb->prepare("
            SELECT
                m.*,
                s.s_title       AS series_title,
                s.s_description AS series_description,
                s.thumbnail_url AS series_thumbnail
            FROM {$t['messages']} AS m
            LEFT JOIN {$t['series']} AS s ON m.primary_series = s.series_id
            WHERE m.message_id = %d
        ", $id), ARRAY_A);

        if (!$row) {
            return new WP_REST_Response(array('error' => 'Sermon not found'), 404);
        }

        // Get all series this message belongs to (via junction table)
        $all_series = $wpdb->get_results($wpdb->prepare("
            SELECT s.series_id, s.s_title, s.thumbnail_url
            FROM {$t['series_matches']} AS sm
            INNER JOIN {$t['series']} AS s ON sm.series_id = s.series_id
            WHERE sm.message_id = %d
        ", $id), ARRAY_A);

        // Get all speakers for this message (via junction table)
        $speakers = $wpdb->get_results($wpdb->prepare("
            SELECT sp.speaker_id, sp.first_name, sp.last_name
            FROM {$t['speaker_matches']} AS msm
            INNER JOIN {$t['speakers']} AS sp ON msm.speaker_id = sp.speaker_id
            WHERE msm.message_id = %d
        ", $id), ARRAY_A);

        // Get all topics for this message
        $topics = $wpdb->get_results($wpdb->prepare("
            SELECT t.topic_id, t.name
            FROM {$t['topic_matches']} AS mtm
            INNER JOIN {$t['topics']} AS t ON mtm.topic_id = t.topic_id
            WHERE mtm.message_id = %d
        ", $id), ARRAY_A);

        // Increment play count
        $wpdb->query($wpdb->prepare(
            "UPDATE {$t['messages']} SET audio_count = audio_count + 1 WHERE message_id = %d",
            $id
        ));

        $response = new WP_REST_Response(array(
            'id'              => (int) $row['message_id'],
            'title'           => $row['title'],
            'slug'            => sanitize_title($row['title']),
            'speaker'         => $row['speaker'],
            'date'            => $row['date'],
            'description'     => $row['description'],
            'duration'        => $row['message_length'],
            'thumbnail'       => $row['message_thumbnail'],
            'audioUrl'        => $row['audio_url'],
            'videoUrl'        => ($row['video_url'] && $row['video_url'] !== '0') ? $row['video_url'] : null,
            'audioFileSize'   => (int) $row['audio_file_size'],
            'audioPlayCount'  => (int) $row['audio_count'] + 1,
            'focusScripture'  => $row['focus_scripture'],
            'seriesId'        => (int) $row['primary_series'],
            'seriesTitle'     => $row['series_title'],
            'seriesDescription' => $row['series_description'],
            'seriesThumbnail' => $row['series_thumbnail'],
            'allSeries'       => array_map(function ($s) {
                return array(
                    'id'        => (int) $s['series_id'],
                    'title'     => $s['s_title'],
                    'thumbnail' => $s['thumbnail_url'],
                );
            }, $all_series ?: array()),
            'speakers'        => array_map(function ($sp) {
                return array(
                    'id'   => (int) $sp['speaker_id'],
                    'name' => trim($sp['first_name'] . ' ' . $sp['last_name']),
                );
            }, $speakers ?: array()),
            'topics'          => array_map(function ($t) {
                return array(
                    'id'   => (int) $t['topic_id'],
                    'name' => $t['name'],
                );
            }, $topics ?: array()),
        ), 200);

        $response->header('Cache-Control', 'public, max-age=3600');
        $response->header('Access-Control-Allow-Origin', '*');

        return $response;
    }

    /* =====================================================================
     *  GET /sermons/series — All series with message counts
     * ===================================================================== */
    public static function get_series($request) {
        global $wpdb;
        $t = self::tables();

        $results = $wpdb->get_results("
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
        ", ARRAY_A);

        $series = array_map(function ($row) {
            return array(
                'id'           => (int) $row['series_id'],
                'title'        => $row['s_title'],
                'description'  => $row['s_description'],
                'thumbnail'    => $row['thumbnail_url'],
                'startDate'    => $row['start_date'],
                'archived'     => $row['archived'] === '1',
                'messageCount' => (int) $row['message_count'],
            );
        }, $results ?: array());

        $response = new WP_REST_Response($series, 200);
        $response->header('Cache-Control', 'public, max-age=3600');
        $response->header('Access-Control-Allow-Origin', '*');

        return $response;
    }

    /* =====================================================================
     *  GET /sermons/speakers — All speakers with message counts
     * ===================================================================== */
    public static function get_speakers($request) {
        global $wpdb;
        $t = self::tables();

        $results = $wpdb->get_results("
            SELECT
                sp.speaker_id,
                sp.first_name,
                sp.last_name,
                COUNT(msm.message_id) AS message_count
            FROM {$t['speakers']} AS sp
            LEFT JOIN {$t['speaker_matches']} AS msm ON sp.speaker_id = msm.speaker_id
            GROUP BY sp.speaker_id
            ORDER BY sp.last_name ASC, sp.first_name ASC
        ", ARRAY_A);

        $speakers = array_map(function ($row) {
            return array(
                'id'           => (int) $row['speaker_id'],
                'name'         => trim($row['first_name'] . ' ' . $row['last_name']),
                'firstName'    => $row['first_name'],
                'lastName'     => $row['last_name'],
                'messageCount' => (int) $row['message_count'],
            );
        }, $results ?: array());

        $response = new WP_REST_Response($speakers, 200);
        $response->header('Cache-Control', 'public, max-age=3600');
        $response->header('Access-Control-Allow-Origin', '*');

        return $response;
    }

    /* =====================================================================
     *  GET /sermons/topics — All topics with message counts
     * ===================================================================== */
    public static function get_topics($request) {
        global $wpdb;
        $t = self::tables();

        $results = $wpdb->get_results("
            SELECT
                t.topic_id,
                t.name,
                COUNT(mtm.message_id) AS message_count
            FROM {$t['topics']} AS t
            LEFT JOIN {$t['topic_matches']} AS mtm ON t.topic_id = mtm.topic_id
            GROUP BY t.topic_id
            HAVING message_count > 0
            ORDER BY t.name ASC
        ", ARRAY_A);

        $topics = array_map(function ($row) {
            return array(
                'id'           => (int) $row['topic_id'],
                'name'         => $row['name'],
                'messageCount' => (int) $row['message_count'],
            );
        }, $results ?: array());

        $response = new WP_REST_Response($topics, 200);
        $response->header('Cache-Control', 'public, max-age=3600');
        $response->header('Access-Control-Allow-Origin', '*');

        return $response;
    }
}

// Register routes on REST API init
add_action('rest_api_init', array('NLWC_Sermons_API', 'register_routes'));
