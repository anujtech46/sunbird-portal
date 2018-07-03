'use strict'
const env = process.env

let envVariables = {
  LEARNER_URL: 'https://500k.ai/api/',
  CONTENT_URL: 'https://500k.ai/api/',
  CONTENT_PROXY_URL: 'https://500k.ai',
  PORTAL_REALM: env.sunbird_portal_realm || 'sunbird',
  PORTAL_AUTH_SERVER_URL: 'https://500k.ai/auth',
  PORTAL_AUTH_SERVER_CLIENT: env.sunbird_portal_auth_server_client || 'portal',
  APPID: env.sunbird_appid || 'sunbird.portal',
  DEFAUULT_TENANT: env.sunbird_default_tenant || 'aiprohub',
  EKSTEP_ENV: env.ekstep_env || 'qa',
  PORTAL_PORT: env.sunbird_port || 3000,
  PORTAL_API_AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMTkyNTBlMGI0Yzc0NWEwOGIyMjFiM2M3OTE3ZTk5MyJ9.2ow7e28seHQNKQ_ZjME1_0QhTGtJKDwu4FQ0qs4CVxU',
  PORTAL_TELEMETRY_PACKET_SIZE: env.sunbird_telemetry_packet_size || 20,
  PORTAL_ECHO_API_URL: 'https://500k.ai/api/echo/',
  PORTAL_AUTOCREATE_TRAMPOLINE_USER: env.sunbird_autocreate_trampoline_user || 'true',
  PORTAL_TRAMPOLINE_CLIENT_ID: env.sunbird_trampoline_client_id || 'trampoline',
  PORTAL_TRAMPOLINE_SECRET: env.sunbird_trampoline_secret,
  ENABLE_PERMISSION_CHECK: env.sunbird_enabless_permission_check || 0,
  PORTAL_SESSION_STORE_TYPE: env.sunbird_session_store_type || 'in-memory',
  PORTAL_TITLE_NAME: env.sunbird_portal_title_name || 'Sunbird',
  PORTAL_CDN_URL: env.sunbird_cdn_url || '',
  PORTAL_THEME: env.sunbird_theme || 'default',
  PORTAL_DEFAULT_LANGUAGE: env.sunbird_portal_default_language || 'en',
  PORTAL_PRIMARY_BUNDLE_LANGUAGE: env.sunbird_portal_primary_bundle_language || 'en',
  CONTENT_SERVICE_UPSTREAM_URL: env.sunbird_content_service_upstream_url || 'http://localhost:5000/',
  LEARNER_SERVICE_UPSTREAM_URL: env.sunbird_learner_service_upstream_url || 'http://localhost:9000/',
  DATASERVICE_URL: env.sunbird_dataservice_url || 'https://500k.ai/api/',
  KEY_CLOAK_PUBLIC: env.sunbird_keycloak_public || 'true',
  KEY_CLOAK_REALM: env.sunbird_keycloak_realm || 'sunbird',
  CACHE_STORE: env.sunbird_cache_store || 'memory',
  CACHE_TTL: env.sunbird_cache_ttl || 1800,
  CONTENT_CHANNEL_FILTER_TYPE: env.sunbird_content_channel_filter_type || 'self',
  learner_Service_Local_BaseUrl: env.sunbird_learner_service_local_base_url || 'http://learner-service:9000',
  content_Service_Local_BaseUrl: env.sunbird_content_service_local_base_url || 'http://content_service_content_service:5000',
  ANDROID_APP_URL: env.sunbird_android_app_url || 'http://www.sunbird.org',
  EXPLORE_BUTTON_VISIBILITY: env.sunbird_explore_button_visibility || false,
  COURSE_COMPLETION_BADGE_ID: env.sunbird_course_completion_badgeid || 'badgeslug-2',
  BADGE_ASSIGN_USERNAME: env.sunbird_badge_assign_username,
  BADGE_ASSIGN_USER_PASSWORD: env.sunbird_badge_assign_user_password,
  AZURE_ACCOUNT_NAME: env.julia_azure_account_name,
  AZURE_ACCOUNT_KEY: env.julia_azure_account_key,
  AZURE_STORAGE_URL: env.julia_azure_storage_url,
  CERTIFICATE_STORE_CONTAINER_NAME: env.julia_certificate_storage_container_name || 'certificate',
  CERTIFICATE_PROVIDER_NAME: env.julia_certificate_provider_name || 'Julia Computing, Inc.',
  CERTIFICATE_INSTRUCTOR_NAME: env.julia_certificate_instructor_name || 'Alan Edelman',
  CONTENT_FEEDBACK_STORE_CONTAINER_NAME: env.julia_content_feedback_storage_container_name || 'feedback',
  JULIA_BOX_BASE_URL: env.julia_server_base_url || 'https://staging.juliabox.com/'
}

envVariables.PORTAL_CASSANDRA_URLS = (env.sunbird_cassandra_urls && env.sunbird_cassandra_urls !== '')
  ? env.sunbird_cassandra_urls.split(',') : ['localhost']

module.exports = envVariables
