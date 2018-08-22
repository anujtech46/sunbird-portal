const env = process.env

module.exports = {
  COURSE_COMPLETION_BADGE_ID: env.sunbird_course_completion_badgeid,
  BADGE_ASSIGN_USERNAME: env.sunbird_badge_assign_username,
  BADGE_ASSIGN_USER_PASSWORD: env.sunbird_badge_assign_user_password,
  AZURE_ACCOUNT_NAME: env.julia_azure_account_name,
  AZURE_ACCOUNT_KEY: env.julia_azure_account_key,
  AZURE_STORAGE_URL: env.julia_azure_storage_url,
  CERTIFICATE_STORE_CONTAINER_NAME: env.julia_certificate_storage_container_name || 'certificate',
  CERTIFICATE_PROVIDER_NAME: env.julia_certificate_provider_name || 'Julia Computing, Inc.',
  CERTIFICATE_INSTRUCTOR_NAME: env.julia_certificate_instructor_name || 'Abhijith Chandraprabhu',
  CONTENT_FEEDBACK_STORE_CONTAINER_NAME: env.julia_content_feedback_storage_container_name || 'feedback',
  JULIA_BOX_BASE_URL: env.julia_server_base_url || 'https://staging.juliabox.com/',
  ADD_TO_DIGILOCKER_APP_URL: env.julia_add_to_digilocker_app_url,
  ADD_TO_DIGILOCKER_APP_ID: env.julia_add_to_digilocker_app_id,
  ADD_TO_DIGILOCKER_APP_KEY: env.julia_add_to_digilocker_app_key,
  API_REQUEST_LIMIT_SIZE: env.julia_api_request_limit_size || '50mb',
  CERTIFICATE_PLATFORM_NAME: env.julia_certificate_platform_name || 'On the 500k.ai platform'
}