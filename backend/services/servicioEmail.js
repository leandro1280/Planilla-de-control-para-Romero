const nodemailer = require('nodemailer');

// Configuración del transportador de correo
// Por defecto usaremos una configuración segura, pero el usuario debe poner sus credenciales en .env
const crearTransportador = () => {
  // Si estamos en desarrollo y no hay credenciales, podríamos usar Ethereal (opcional)
  // Por ahora, configuramos para usar Gmail o un SMTP estándar
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail' es lo más común
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Para Gmail, esto suele ser una "Contraseña de Aplicación"
    },
    tls: {
      rejectUnauthorized: false // Ayuda en desarrollo si hay problemas de certificados SSL (Avast, redes corp, etc)
    }
  });
};

/**
 * Envía una alerta de mantenimiento por correo electrónico
 * @param {Array} mantenimientos - Lista de mantenimientos que vencen pronto
 * @param {string} destinatario - Correo electrónico del destinatario
 */
const enviarAlertaMantenimiento = async (mantenimientos, destinatario) => {
  if (!mantenimientos || mantenimientos.length === 0) return;

  const transporter = crearTransportador();

  // Construir el cuerpo del correo en HTML
  const filasTabla = mantenimientos.map(m => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">${m.equipo}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${m.producto ? m.producto.nombre : 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd; color: #d9534f; font-weight: bold;">
        ${new Date(m.fechaVencimiento).toLocaleDateString('es-AR')}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">⚠️ Alerta de Mantenimiento - Romero Panificados</h2>
      <p>Hola,</p>
      <p>Los siguientes mantenimientos están programados para vencer <strong>mañana</strong>:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Equipo</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Producto</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          ${filasTabla}
        </tbody>
      </table>

      <p style="margin-top: 20px;">Por favor, revise el sistema para más detalles.</p>
      <a href="${process.env.BASE_URL || 'http://localhost:3000'}/mantenimientos" 
         style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Ir a Mantenimientos
      </a>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Sistema Romero" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `⚠️ ${mantenimientos.length} Mantenimiento(s) Vencen Mañana`,
      html: htmlContent
    });
    console.log('📧 Correo de alerta enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de alerta:', error);
    return false;
  }
};

module.exports = {
  enviarAlertaMantenimiento
};
