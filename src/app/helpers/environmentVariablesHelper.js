'use strict'
const env = process.env
const fs = require('fs')
const packageObj = JSON.parse(fs.readFileSync('package.json', 'utf8'))
process.env.sunbird_environment = 'qa'
let envVariables = {
  LEARNER_URL: env.sunbird_learner_player_url || 'https://staging.open-sunbird.org/api/',
  CONTENT_URL: env.sunbird_content_player_url || 'https://staging.open-sunbird.org/api/',
  CONFIG_URL: env.sunbird_config_service_url || 'https://staging.open-sunbird.org/api/config/',
  CONFIG_REFRESH_INTERVAL: env.config_refresh_interval || 10,
  CONFIG_SERVICE_ENABLED: env.config_service_enabled || false,
  CONTENT_PROXY_URL: env.sunbird_content_proxy_url || 'https://staging.open-sunbird.org',
  PORTAL_REALM: env.sunbird_portal_realm || 'sunbird',
  PORTAL_AUTH_SERVER_URL: env.sunbird_portal_auth_server_url || 'https://staging.open-sunbird.org/auth',
  PORTAL_AUTH_SERVER_CLIENT: env.sunbird_portal_auth_server_client || 'portal',
  APPID: process.env.sunbird_environment + '.' + process.env.sunbird_instance + '.portal',
  DEFAULT_CHANNEL: env.sunbird_default_channel,
  EKSTEP_ENV: env.ekstep_env || 'qa',
  PORTAL_PORT: env.sunbird_port || 3000,
  PORTAL_API_AUTH_TOKEN: env.sunbird_api_auth_token,
  PORTAL_TELEMETRY_PACKET_SIZE: env.sunbird_telemetry_packet_size || 1000,
  PORTAL_ECHO_API_URL: env.sunbird_echo_api_url || 'https://staging.open-sunbird.org/api/echo/',
  PORTAL_AUTOCREATE_TRAMPOLINE_USER: env.sunbird_autocreate_trampoline_user || 'true',
  PORTAL_TRAMPOLINE_CLIENT_ID: env.sunbird_trampoline_client_id || 'trampoline',
  PORTAL_TRAMPOLINE_SECRET: env.sunbird_trampoline_secret,
  ENABLE_PERMISSION_CHECK: env.sunbird_enabless_permission_check || 0,
  PORTAL_SESSION_STORE_TYPE: env.sunbird_session_store_type || 'in-memory',
  PORTAL_CDN_URL: env.sunbird_portal_cdn_url || '',
  CONTENT_SERVICE_UPSTREAM_URL: env.sunbird_content_service_upstream_url || 'http://localhost:5000/',
  LEARNER_SERVICE_UPSTREAM_URL: env.sunbird_learner_service_upstream_url || 'http://localhost:9000/',
  DATASERVICE_URL: env.sunbird_dataservice_url || 'https://staging.open-sunbird.org/api/',
  KEY_CLOAK_PUBLIC: env.sunbird_keycloak_public || 'true',
  KEY_CLOAK_REALM: env.sunbird_keycloak_realm || 'sunbird',
  CACHE_STORE: env.sunbird_cache_store || 'memory',
  CACHE_TTL: env.sunbird_cache_ttl || 1800,
  ANDROID_APP_URL: env.sunbird_android_app_url || 'http://www.sunbird.org',
  BUILD_NUMBER: env.sunbird_build_number || packageObj.version + '.' + packageObj.buildHash,
  TELEMETRY_SERVICE_LOCAL_URL: env.sunbird_telemetry_service_local_url || 'http://telemetry-service:9001/',
  PORTAL_API_CACHE_TTL: env.sunbird_api_response_cache_ttl || '600',
  TENANT_CDN_URL: env.sunbird_tenant_cdn_url || '',
  CLOUD_STORAGE_URLS: env.sunbird_cloud_storage_urls,
  PORTAL_CASSANDRA_CONSISTENCY_LEVEL: env.sunbird_cassandra_consistency_level || 'one',
  PORTAL_CASSANDRA_REPLICATION_STRATEGY: env.sunbird_cassandra_replication_strategy || '{"class":"SimpleStrategy","replication_factor":1}',
  PORTAL_EXT_PLUGIN_URL: process.env.sunbird_ext_plugin_url || 'http://player_player:3000/plugin/',
  DEVICE_REGISTER_API: process.env.sunbird_device_register_api || 'https://api.open-sunbird.org/v3/device/register/',
  sunbird_instance_name: env.sunbird_instance || 'Sunbird',
  sunbird_theme: env.sunbird_theme || 'default',
  sunbird_default_language: env.sunbird_portal_default_language || 'en',
  sunbird_primary_bundle_language: env.sunbird_portal_primary_bundle_language || 'en',
  learner_Service_Local_BaseUrl: env.sunbird_learner_service_local_base_url || 'http://learner-service:9000',
  content_Service_Local_BaseUrl: env.sunbird_content_service_local_base_url || 'http://content-service:5000',
  sunbird_explore_button_visibility: env.sunbird_explore_button_visibility || 'true',
  sunbird_help_link_visibility: env.sunbird_help_link_visibility || 'false',
  sunbird_extcont_whitelisted_domains: env.sunbird_extcont_whitelisted_domains || 'youtube.com,youtu.be',
  sunbird_portal_user_upload_ref_link: env.sunbird_portal_user_upload_ref_link || 'http://www.sunbird.org/features-documentation/register_user',
  sunbird_portal_video_max_size: env.sunbird_portal_video_max_size || '50',
  GOOGLE_OAUTH_CONFIG: {
    clientId: env.sunbird_google_oauth_clientId,
    clientSecret: env.sunbird_google_oauth_clientSecret
  },
  KEYCLOAK_GOOGLE_CLIENT: {
    clientId: env.sunbird_google_keycloak_client_id,
    secret: env.sunbird_google_keycloak_secret
  },
  sunbird_google_captcha_site_key: env.sunbird_google_captcha_site_key,
  sunbird_azure_report_container_name: env.sunbird_azure_report_container_name || 'reports',
  sunbird_azure_account_name: env.sunbird_azure_account_name || 'jaldhara',
  sunbird_azure_account_key:  env.sunbird_azure_account_key
}

envVariables.PORTAL_CASSANDRA_URLS = (env.sunbird_cassandra_urls && env.sunbird_cassandra_urls !== '')
  ? env.sunbird_cassandra_urls.split(',') : ['localhost']

// Forwater related chnages
const jaldhara_env_variables = {
  JALDHARA_NEWS_RSS_FEED_URL: env.jaldhara_news_rssfeed_url || 'http://www.indiawaterportal.org/articles/feed',
  JALDHARA_OPPORTUNITIES_RSS_FEED_URL: env.jaldhara_opportunities_rssfeed_url || 'http://www.indiawaterportal.org/rss-opportunities-feed',
  JALDHARA_QUESTION_RSS_FEED_URL: env.jaldhara_question_rssfeed_url || 'http://www.indiawaterportal.org/rss-questions-feed',
  JALDHARA_RESEARCH_PAPERS_RSS_FEED_URL: env.jaldhara_research_papers_rssfeed_url || 'http://www.indiawaterportal.org/rss-research-papers-feeds',
  ISSUE_FORWATER_URL: env.jaldhara_issue_forwater_url || 'https://issues.jaldhara.in',
  DISCUSS_FORWATER_URL: env.jaldhara_discuss_forwater_url || 'https://discuss.jaldhara.in',

  // branding
  LOGO_URL: env.jaldhara_logo || 'https://jaldhara.blob.core.windows.net/portal-logo/dev_sunbird_logo.png',
  FAVICON_URL: env.jaldhara_favicon || 'https://jaldhara.blob.core.windows.net/portal-logo/dev_favicon.ico',

  //botpress
  BOT_URL: env.jaldhara_botUrl || 'http://52.66.209.199',
  BOT_PRESS_ENABLED: env.bot_press_url_enable || 'false',

  // Error handler plugin
  ERROR_HANDLER_PLUGIN: env.jaldhara_error_handler_plugin// || 'https://4ce64633ee3742ddb72156b15d12701a@sentry.io/1363896'
}

// Combine both env variables
envVariables = Object.assign({}, envVariables, jaldhara_env_variables)

// For run development
// if (process.env.NODE_ENV === 'local') {
  envVariables = Object.assign({}, envVariables, require('./jaldhara.localVariables'))
// }

module.exports = envVariables