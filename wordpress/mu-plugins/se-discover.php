<?php
/**
 * TEMPORARY: Series Engine Table Discovery
 * 
 * Upload to: wp-content/mu-plugins/se-discover.php
 * Access via: https://ikorodu.nlwc.church/wp-json/nlwc/v1/se-tables
 * 
 * ⚠️ DELETE THIS FILE after you've confirmed the table names!
 */

add_action('rest_api_init', function () {
    register_rest_route('nlwc/v1', '/se-tables', array(
        'methods'  => 'GET',
        'callback' => function () {
            global $wpdb;

            // Find all Series Engine tables
            $se_tables = $wpdb->get_results("SHOW TABLES LIKE '%se_%'", ARRAY_N);
            $enmse_tables = $wpdb->get_results("SHOW TABLES LIKE '%enmse%'", ARRAY_N);
            $sermon_tables = $wpdb->get_results("SHOW TABLES LIKE '%sermon%'", ARRAY_N);
            $message_tables = $wpdb->get_results("SHOW TABLES LIKE '%message%'", ARRAY_N);
            $speaker_tables = $wpdb->get_results("SHOW TABLES LIKE '%speaker%'", ARRAY_N);

            $all_tables = array_merge($se_tables, $enmse_tables, $sermon_tables, $message_tables, $speaker_tables);
            $unique_tables = array_unique(array_map(function($t) { return $t[0]; }, $all_tables));

            $result = array();
            foreach ($unique_tables as $table_name) {
                $columns = $wpdb->get_results("DESCRIBE `{$table_name}`", ARRAY_A);
                $count = $wpdb->get_var("SELECT COUNT(*) FROM `{$table_name}`");
                $sample = $wpdb->get_results("SELECT * FROM `{$table_name}` LIMIT 2", ARRAY_A);

                $result[] = array(
                    'table' => $table_name,
                    'row_count' => $count,
                    'columns' => array_map(function($c) {
                        return array(
                            'name' => $c['Field'],
                            'type' => $c['Type'],
                            'key' => $c['Key'],
                        );
                    }, $columns),
                    'sample_rows' => $sample,
                );
            }

            return new WP_REST_Response($result, 200);
        },
        'permission_callback' => '__return_true',
    ));
});
