/**
 * Helpers para tests
 */

/**
 * Obtener token de cookie de respuesta de login
 */
exports.getTokenFromLoginResponse = (loginResponse) => {
  let token = null;
  
  // Intentar obtener de cookie
  if (loginResponse.headers['set-cookie']) {
    const cookieHeader = loginResponse.headers['set-cookie'].find(c => c.startsWith('token='));
    if (cookieHeader) {
      token = cookieHeader.split(';')[0].split('=')[1];
    }
  }
  
  // Si no hay cookie, intentar del body
  if (!token && loginResponse.body && loginResponse.body.data && loginResponse.body.data.token) {
    token = loginResponse.body.data.token;
  }
  
  if (!token && loginResponse.body && loginResponse.body.token) {
    token = loginResponse.body.token;
  }
  
  return token;
};

/**
 * Crear cookie header con token
 */
exports.createAuthCookie = (token) => {
  return `token=${token}`;
};

