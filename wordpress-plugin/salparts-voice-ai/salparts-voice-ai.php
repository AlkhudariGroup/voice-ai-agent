<?php
/**
 * Plugin Name: Sal Parts Voice AI
 * Plugin URI: https://salparts.com
 * Description: Voice AI assistant for Sal Parts - auto spare parts store. Clients can chat or speak to ask about products.
 * Version: 1.0.0
 * Author: Sal Parts
 * Author URI: https://salparts.com
 * Text Domain: salparts-voice-ai
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) exit;

define('SALPARTS_VOICE_AI_VERSION', '1.0.0');
define('SALPARTS_VOICE_AI_PATH', plugin_dir_path(__FILE__));
define('SALPARTS_VOICE_AI_URL', plugin_dir_url(__FILE__));

class SalParts_Voice_AI {

    private $options;

    public function __construct() {
        add_action('wp_footer', [$this, 'render_widget']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function get_options() {
        if ($this->options === null) {
            $defaults = [
                'app_url' => 'https://voice-ai-agent-pearl.vercel.app',
                'site_name' => 'Sal Parts',
                'site_description' => 'Auto spare parts for Mercedes, Audi, BMW, Range Rover, Rolls Royce, Ferrari, Lamborghini - Germany',
                'logo_url' => SALPARTS_VOICE_AI_URL . 'assets/logo.png',
                'enabled' => true,
            ];
            $this->options = wp_parse_args(get_option('salparts_voice_ai_options', []), $defaults);
        }
        return $this->options;
    }

    public function add_admin_menu() {
        add_options_page(
            'Sal Parts Voice AI',
            'Voice AI',
            'manage_options',
            'salparts-voice-ai',
            [$this, 'render_admin_page']
        );
    }

    public function register_settings() {
        register_setting('salparts_voice_ai', 'salparts_voice_ai_options', [
            'sanitize_callback' => [$this, 'sanitize_options'],
        ]);
    }

    public function sanitize_options($input) {
        return [
            'app_url' => esc_url_raw($input['app_url'] ?? ''),
            'site_name' => sanitize_text_field($input['site_name'] ?? 'Sal Parts'),
            'site_description' => sanitize_textarea_field($input['site_description'] ?? ''),
            'logo_url' => esc_url_raw($input['logo_url'] ?? ''),
            'enabled' => !empty($input['enabled']),
        ];
    }

    public function render_admin_page() {
        $opts = $this->get_options();
        ?>
        <div class="wrap">
            <h1>Sal Parts Voice AI</h1>
            <form method="post" action="options.php">
                <?php settings_fields('salparts_voice_ai'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="enabled">Enable</label></th>
                        <td>
                            <input type="checkbox" name="salparts_voice_ai_options[enabled]" id="enabled"
                                   value="1" <?php checked($opts['enabled']); ?>>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="app_url">Voice AI App URL</label></th>
                        <td>
                            <input type="url" name="salparts_voice_ai_options[app_url]" id="app_url"
                                   value="<?php echo esc_attr($opts['app_url']); ?>" class="regular-text">
                            <p class="description">URL of the deployed Voice AI app.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="site_name">Store Name</label></th>
                        <td>
                            <input type="text" name="salparts_voice_ai_options[site_name]" id="site_name"
                                   value="<?php echo esc_attr($opts['site_name']); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th><label for="site_description">Store Description</label></th>
                        <td>
                            <textarea name="salparts_voice_ai_options[site_description]" id="site_description"
                                      rows="3" class="large-text"><?php echo esc_textarea($opts['site_description']); ?></textarea>
                            <p class="description">What the AI tells visitors about your store.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="logo_url">Logo URL</label></th>
                        <td>
                            <input type="url" name="salparts_voice_ai_options[logo_url]" id="logo_url"
                                   value="<?php echo esc_attr($opts['logo_url']); ?>" class="regular-text">
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function render_widget() {
        $opts = $this->get_options();
        if (!$opts['enabled']) return;

        $embed_url = add_query_arg([
            'site' => $opts['site_name'],
            'desc' => rawurlencode($opts['site_description']),
        ], rtrim($opts['app_url'], '/') . '/embed');
        ?>
        <div id="salparts-voice-ai-widget">
            <button type="button" id="salparts-voice-ai-btn" aria-label="Open Voice AI">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                </svg>
            </button>
            <div id="salparts-voice-ai-modal" style="display:none">
                <div class="salparts-voice-ai-overlay"></div>
                <div class="salparts-voice-ai-frame">
                    <button type="button" class="salparts-voice-ai-close">&times;</button>
                    <iframe src="<?php echo esc_url($embed_url); ?>" title="Voice AI"></iframe>
                </div>
            </div>
        </div>
        <style>
            #salparts-voice-ai-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #eab308;
                color: #0a0a0a;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(234,179,8,0.4);
                z-index: 99998;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #salparts-voice-ai-btn:hover { background: #facc15; }
            #salparts-voice-ai-modal { position: fixed; inset: 0; z-index: 99999; }
            .salparts-voice-ai-overlay {
                position: absolute; inset: 0;
                background: rgba(0,0,0,0.6);
            }
            .salparts-voice-ai-frame {
                position: absolute;
                inset: 24px;
                background: #0a0a0a;
                border-radius: 16px;
                overflow: hidden;
            }
            .salparts-voice-ai-frame iframe {
                width: 100%; height: 100%; border: 0;
            }
            .salparts-voice-ai-close {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 1;
            }
        </style>
        <script>
            (function() {
                var btn = document.getElementById('salparts-voice-ai-btn');
                var modal = document.getElementById('salparts-voice-ai-modal');
                var close = modal && modal.querySelector('.salparts-voice-ai-close');
                var overlay = modal && modal.querySelector('.salparts-voice-ai-overlay');
                if (btn && modal) {
                    btn.onclick = function() {
                        modal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    };
                    if (close) close.onclick = hide;
                    if (overlay) overlay.onclick = hide;
                    function hide() {
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                }
            })();
        </script>
        <?php
    }
}

new SalParts_Voice_AI();
