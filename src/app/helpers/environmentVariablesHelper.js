'use strict'
const env = process.env
const fs = require('fs')
const packageObj = JSON.parse(fs.readFileSync('package.json', 'utf8'));

let envVariables = {
  LEARNER_URL: env.sunbird_learner_player_url || 'https://staging.open-sunbird.org/api/',
  CONTENT_URL: env.sunbird_content_player_url || 'https://staging.open-sunbird.org/api/',
  CONTENT_PROXY_URL: env.sunbird_content_proxy_url || 'https://staging.open-sunbird.org',
  PORTAL_REALM: env.sunbird_portal_realm || 'sunbird',
  PORTAL_AUTH_SERVER_URL: env.sunbird_portal_auth_server_url || 'https://staging.open-sunbird.org/auth',
  PORTAL_AUTH_SERVER_CLIENT: env.sunbird_portal_auth_server_client || 'portal',
  APPID: process.env.sunbird_environment + '.' + process.env.sunbird_instance + '.portal',
  DEFAULT_CHANNEL: env.sunbird_default_channel || 'aiprohub',
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
  PORTAL_TITLE_NAME: env.sunbird_instance || 'Sunbird',
  PORTAL_CDN_URL: env.sunbird_portal_cdn_url || '',
  PORTAL_THEME: env.sunbird_theme || 'default',
  PORTAL_DEFAULT_LANGUAGE: env.sunbird_portal_default_language || 'en',
  PORTAL_PRIMARY_BUNDLE_LANGUAGE: env.sunbird_portal_primary_bundle_language || 'en',
  CONTENT_SERVICE_UPSTREAM_URL: env.sunbird_content_service_upstream_url || 'http://localhost:5000/',
  LEARNER_SERVICE_UPSTREAM_URL: env.sunbird_learner_service_upstream_url || 'http://localhost:9000/',
  DATASERVICE_URL: env.sunbird_dataservice_url || 'https://staging.open-sunbird.org/api/',
  KEY_CLOAK_PUBLIC: env.sunbird_keycloak_public || 'true',
  KEY_CLOAK_REALM: env.sunbird_keycloak_realm || 'sunbird',
  CACHE_STORE: env.sunbird_cache_store || 'memory',
  CACHE_TTL: env.sunbird_cache_ttl || 1800,
  learner_Service_Local_BaseUrl: env.sunbird_learner_service_local_base_url || 'http://learner-service:9000',
  content_Service_Local_BaseUrl: env.sunbird_content_service_local_base_url || 'http://content_service_content_service:5000',
  ANDROID_APP_URL: env.sunbird_android_app_url || 'http://www.sunbird.org',
  EXPLORE_BUTTON_VISIBILITY: env.sunbird_explore_button_visibility || 'true',
  ENABLE_SIGNUP: env.sunbird_enable_signup || 'true',
  BUILD_NUMBER: env.build_number || packageObj.version+'.'+packageObj.buildNumber,
  TELEMETRY_SERVICE_LOCAL_URL: env.sunbird_telemetry_service_local_url || 'http://telemetry-service:9001/',
  PORTAL_API_CACHE_TTL: env.sunbird_api_response_cache_ttl || '600',
  SUNBIRD_EXTCONT_WHITELISTED_DOMAINS: env.sunbird_extcont_whitelisted_domains || 'youtube.com,youtu.be,juliabox.com',
  TENANT_CDN_URL: env.sunbird_tenant_cdn_url || '',
  CLOUD_STORAGE_URLS: env.sunbird_cloud_storage_urls
}

const julia_env_variable = {
  COURSE_COMPLETION_BADGE_ID: env.sunbird_course_completion_badgeid || 'badgeslug-2',
  BADGE_ASSIGN_USERNAME: env.sunbird_badge_assign_username,
  BADGE_ASSIGN_USER_PASSWORD: env.sunbird_badge_assign_user_password,
  AZURE_ACCOUNT_NAME: env.julia_azure_account_name,
  AZURE_ACCOUNT_KEY: env.julia_azure_account_key,
  AZURE_STORAGE_URL: env.julia_azure_storage_url,
  CERTIFICATE_STORE_CONTAINER_NAME: env.julia_certificate_storage_container_name || 'certificate',
  CERTIFICATE_PROVIDER_NAME: env.julia_certificate_provider_name || 'Julia Computing, Inc.',
  CERTIFICATE_INSTRUCTOR_NAME: env.julia_certificate_instructor_name || 'Abhijith Chandraprabhu',
  CONTENT_FEEDBACK_STORE_CONTAINER_NAME: env.julia_content_feedback_storage_container_name || 'feedback',
  JULIA_BOX_BASE_URL: env.julia_server_base_url || 'https://juliabox.com/', 
  SUNBIRD_EXTERNAL_CONTENT_WHITELISTED_DOMAINS: env.sunbird_external_content_whitelisted_domains || ['youtube.com','juliabox.com'],
  ADD_TO_DIGILOCKER_APP_URL: env.julia_add_to_digilocker_app_url,
  ADD_TO_DIGILOCKER_APP_ID: env.julia_add_to_digilocker_app_id,
  ADD_TO_DIGILOCKER_APP_KEY: env.julia_add_to_digilocker_app_key,
  API_REQUEST_LIMIT_SIZE: env.julia_api_request_limit_size || '50mb',
  CERTIFICATE_PLATFORM_NAME: env.julia_certificate_platform_name,
  IS_DIGILOCKER_ENABLED: env.julia_is_digiLocker_enabled || 'false',
  IS_COLLECT_PAYMENT_ENABLED: env.julia_is_collect_payment_enabled || 'false',
  IS_REFUND_PAYMENT_ENABLED: env.julia_is_refund_payment_enabled || 'false',
  PRIVACY_POLICY_URL: env.julia_privacy_policies || 'https://jaldhara.blob.core.windows.net/attachments/announcement/privacyPolicy.pdf',
  TERM_OF_SERVICE_URL: env.julia_terms_of_service || 'https://jaldhara.blob.core.windows.net/attachments/announcement/TermsOfService.pdf',
  IDENTITY_PROVIDER: env.julia_identity_provider || 'oidc',
  IDENTITY_PROVIDER_SCOPE: env.julia_identity_provider_scope || 'offline_access email profile',
  JULIA_BOX_SUPPORT_EMAIL: env.julia_box_support_email || 'academy@juliacomputing.com',
  PORTAL_ADMIN_TRAMPOLINE_CLIENT_ID: env.sunbird_trampoline_admin_client_id,
  ERROR_HANDLER_PLUGIN: env.jaldhara_error_handler_plugin,
}

envVariables.PORTAL_CASSANDRA_URLS = (env.sunbird_cassandra_urls && env.sunbird_cassandra_urls !== '')
  ? env.sunbird_cassandra_urls.split(',') : ['localhost']

envVariables = { ...envVariables, ...julia_env_variable }

if (process.env.NODE_ENV === 'local') {   
  envVariables = Object.assign({}, envVariables,  require('./localVariables'));
}

module.exports = envVariables;