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

/**
 * Envía una alerta de stock bajo por correo electrónico
 * @param {Array} productos - Lista de productos con stock bajo
 * @param {string} destinatario - Correo electrónico del destinatario
 * @param {number} umbralCritico - Umbral para stock crítico (default: 4)
 * @param {number} umbralBajo - Umbral para stock bajo (default: 10)
 */
const enviarAlertaStockBajo = async (productos, destinatario, umbralCritico = 4, umbralBajo = 10) => {
  if (!productos || productos.length === 0) return;

  const transporter = crearTransportador();

  // Separar productos críticos y bajo stock
  const criticos = productos.filter(p => p.existencia <= umbralCritico);
  const bajoStock = productos.filter(p => p.existencia > umbralCritico && p.existencia < umbralBajo);

  const filasCriticas = criticos.map(p => `
    <tr style="background-color: #fee;">
      <td style="padding: 10px; border: 1px solid #ddd; color: #d9534f; font-weight: bold;">${p.referencia || 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${p.nombre || 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${p.tipo || 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd; color: #d9534f; font-weight: bold; text-align: center;">${p.existencia}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${(p.costoUnitario || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
    </tr>
  `).join('');

  const filasBajoStock = bajoStock.map(p => `
    <tr style="background-color: #fffbf0;">
      <td style="padding: 10px; border: 1px solid #ddd;">${p.referencia || 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${p.nombre || 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${p.tipo || 'N/A'}</td>
      <td style="padding: 10px; border: 1px solid #ddd; color: #f0ad4e; font-weight: bold; text-align: center;">${p.existencia}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${(p.costoUnitario || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">⚠️ Alerta de Stock Bajo - Romero Panificados</h2>
      <p>Hola,</p>
      <p>Se han detectado productos con <strong>stock bajo o crítico</strong> en el inventario:</p>
      
      ${criticos.length > 0 ? `
      <h3 style="color: #d9534f; margin-top: 30px;">🔴 Stock Crítico (≤${umbralCritico})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Referencia</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Producto</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Tipo</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Stock</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Costo Unit.</th>
          </tr>
        </thead>
        <tbody>
          ${filasCriticas}
        </tbody>
      </table>
      ` : ''}
      
      ${bajoStock.length > 0 ? `
      <h3 style="color: #f0ad4e; margin-top: 30px;">🟡 Bajo Stock (<${umbralBajo})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Referencia</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Producto</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Tipo</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Stock</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Costo Unit.</th>
          </tr>
        </thead>
        <tbody>
          ${filasBajoStock}
        </tbody>
      </table>
      ` : ''}

      <p style="margin-top: 30px;"><strong>Total:</strong> ${productos.length} producto(s) requieren atención</p>
      <p style="margin-top: 20px;">Por favor, revise el sistema y considere realizar un pedido.</p>
      <a href="${process.env.BASE_URL || 'http://localhost:3000'}/inventario?stock=sin-stock" 
         style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Ver Inventario
      </a>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Sistema Romero" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `⚠️ Alerta: ${productos.length} Producto(s) con Stock Bajo`,
      html: htmlContent
    });
    console.log('📧 Correo de alerta de stock enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de alerta de stock:', error);
    return false;
  }
};

module.exports = {
  enviarAlertaMantenimiento,
  enviarAlertaStockBajo
};
