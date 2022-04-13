/**
 * name : http-status-code/index.js
 * author : Aman Jung Karki
 * Date : 11-Nov-2019
 * Description : All http status code and there message.
 */


module.exports = {
  'continue': {
    status: 100,
    message: "Continue"
  },
  'switching_protocols': {
    status: 101,
    message: "Switching protocols"
  },
  'ok': {
    status: 200,
    message: "Success",
    code : "OK"
  },
  'created': {
    status: 201,
    message: "Created"
  },
  'accepted': {
    status: 202,
    message: "Accepted"
  },
  'non_authoritative_information': {
    status: 203,
    message: "Non-Authoritative Information"
  },
  'no_content': {
    status: 204,
    message: "No Content"
  },
  'reset_content': {
    status: 205,
    message: "Reset Content"
  },
  'partial_content': {
    status: 206,
    message: "Partial Content"
  },
  'multiple_choices': {
    status: 300,
    message: "Multiple Choices"
  },

  'moved_permanently': {
    status: 301,
    message: "Moved Permanently"
  },
  'found': {
    status: 302,
    message: "Found"
  },
  'see_other': {
    status: 303,
    message: "See Other"
  },
  'not_modified': {
    status: 304,
    message: "Not Modified"
  },
  'use_proxy': {
    status: 305,
    message: "Use Proxy"
  },
  'temporary_redirect': {
    status: 307,
    message: "Temporary Redirect"
  },
  'bad_request': {
    status: 400,
    message: "Bad request"
  },
  'unauthorized': {
    status: 401,
    message: "Unauthorized"
  },
  'payment_required': {
    status: 402,
    message: "Payment Required"
  },
  'forbidden': {
    status: 403,
    message: "Forbidden"
  },
  'not_found': {
    status: 404,
    message: "Not Found"
  },
  'method_not_allowed': {
    status: 405,
    message: "Method Not allowed"
  },
  'not_acceptable': {
    status: 406,
    message: "Not Acceptable"
  },
  'proxy_authentication_required': {
    status: 407,
    message: "Proxy Authentication Required"
  },
  'request_timeout': {
    status: 408,
    message: "Request Timeout"
  },
  'conflict': {
    status: 409,
    message: "Conflict"
  },
  'gone': {
    status: 410,
    message: "Gone"
  },
  'length_required': {
    status: 411,
    message: "Length Required"
  },
  'precondition_failed': {
    status: 412,
    message: "Pre-Condition failed"
  },
  'request_entity_too_large': {
    status: 413,
    message: "Request Entity Too Large"
  },
  'request_uri_too_long': {
    status: 414,
    message: "Request URI Too Long"
  },
  'unsupported_media_type': {
    status: 415,
    message: "Un Supported Media Type"
  },
  'requested_range_not_satisfiable': {
    status: 416,
    message: "Requested Range Not Satisfiable"
  },
  'expectation_failed': {
    status: 417,
    message: "Expectation Failed"
  },
  'unprocessable_entity': {
    status: 422,
    message: "Unprocessable entity"
  },
  'failed_dependency': {
    status: 424,
    message: "Failed Dependency"
  },
  'too_many_requests': {
    status: 429,
    message: "Too Many Requests"
  },
  'unavailable_for_legal_reasons': {
    status: 451,
    message: "Unavailable For Legal Reasons"
  },
  'internal_server_error': {
    status: 500,
    message: "Oops! Something Went Wrong."
  },
  'not_implemented': {
    status: 501,
    message: "Not Implemented"
  },
  'bad_gateway': {
    status: 502,
    message: "Bad Gateway"
  },
  'service_unavailable': {
    status: 503,
    message: "Service Unavailable"
  },
  'gateway_timeout': {
    status: 504,
    message: "Gateway Timeout"
  },
  'http_version_not_supported': {
    status: 505,
    message: "HTTP Version Not Supported"
  },
  'insufficient_storage': {
    status: 507,
    message: "Insufficient Storage"
  }
};
