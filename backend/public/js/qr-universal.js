// Escáner QR Universal - Disponible desde el navbar
document.addEventListener('DOMContentLoaded', function () {
  const btnQrUniversal = document.getElementById('btn-qr-universal');
  const universalQrModal = new bootstrap.Modal(document.getElementById('universalQrModal'));
  const universalQrScanner = document.getElementById('universal-qr-scanner');
  const universalQrResult = document.getElementById('universal-qr-result');
  let html5QrCode = null;

  // Botón del navbar para abrir el escáner universal
  if (btnQrUniversal) {
    btnQrUniversal.addEventListener('click', function () {
      universalQrResult.className = 'mb-3 d-none';
      universalQrResult.innerHTML = '';
      universalQrModal.show();
    });
  }

  // Inicializar escáner cuando se abre el modal
  const universalQrModalElement = document.getElementById('universalQrModal');
  if (universalQrModalElement) {
    universalQrModalElement.addEventListener('shown.bs.modal', async () => {
      if (html5QrCode) {
        // Si ya existe un escáner, detenerlo primero
        await html5QrCode.stop().catch(() => {});
      }

      universalQrScanner.innerHTML = '<div id="reader-universal"></div>';
      html5QrCode = new Html5Qrcode('reader-universal');

      try {
        const videoInputDevices = await Html5Qrcode.getCameras();
        
        if (videoInputDevices && videoInputDevices.length) {
          // Buscar cámara trasera o usar la primera disponible
          const rearCamera = videoInputDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment')
          );
          const cameraId = rearCamera ? rearCamera.id : videoInputDevices[0].id;

          html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 300, height: 300 }
            },
            (decodedText, decodedResult) => {
              onUniversalScanSuccess(decodedText, decodedResult);
            },
            (errorMessage) => {
              // Ignorar errores de escaneo continuo
            }
          ).catch((err) => {
            console.error('Error al iniciar el escáner:', err);
            universalQrResult.classList.remove('d-none');
            universalQrResult.className = 'mb-3 alert alert-danger';
            universalQrResult.innerHTML = `
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Error al iniciar la cámara. Asegúrate de dar permisos y que no esté en uso.
            `;
          });
        } else {
          universalQrResult.classList.remove('d-none');
          universalQrResult.className = 'mb-3 alert alert-warning';
          universalQrResult.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            No se encontraron cámaras en este dispositivo.
          `;
        }
      } catch (error) {
        console.error('Error al obtener cámaras:', error);
        universalQrResult.classList.remove('d-none');
        universalQrResult.className = 'mb-3 alert alert-danger';
        universalQrResult.innerHTML = `
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Error al acceder a las cámaras: ${error.message}
        `;
      }
    });

    // Detener escáner cuando se cierra el modal
    universalQrModalElement.addEventListener('hidden.bs.modal', async () => {
      if (html5QrCode) {
        await html5QrCode.stop().catch(err => console.error('Error al detener el scanner:', err));
        html5QrCode.clear();
        universalQrScanner.innerHTML = '';
      }
    });
  }

  // Función que se ejecuta cuando se escanea un código
  async function onUniversalScanSuccess(decodedText, decodedResult) {
    // Detener el escáner
    if (html5QrCode) {
      await html5QrCode.stop().catch(err => console.error('Error al detener el scanner:', err));
    }

    // Feedback háptico
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // Mostrar el código escaneado
    universalQrResult.classList.remove('d-none');
    universalQrResult.className = 'mb-3 alert alert-info';
    universalQrResult.innerHTML = `
      <div class="d-flex align-items-start">
        <i class="bi bi-qr-code me-2 fs-5"></i>
        <div class="flex-grow-1">
          <strong>Código escaneado:</strong><br>
          <code class="d-block mt-2 p-2 bg-white rounded">${decodedText}</code>
          <small class="d-block mt-2 text-muted">Buscando producto en el inventario...</small>
        </div>
      </div>
    `;

    // Buscar producto en el inventario
    try {
      const response = await fetch(`/inventario/productos/buscar?codigo=${encodeURIComponent(decodedText)}`);
      const data = await response.json();

      if (data.success && data.producto) {
        // Producto encontrado
        universalQrResult.className = 'mb-3 alert alert-success';
        universalQrResult.innerHTML = `
          <h6 class="alert-heading"><i class="bi bi-check-circle-fill me-2"></i>Producto encontrado</h6>
          <p class="mb-2"><strong>Referencia:</strong> ${data.producto.referencia}</p>
          <p class="mb-2"><strong>Nombre:</strong> ${data.producto.nombre}</p>
          <p class="mb-2"><strong>Stock:</strong> ${data.producto.existencia}</p>
          <p class="mb-0">
            <a href="/inventario?busqueda=${encodeURIComponent(data.producto.referencia)}" class="btn btn-sm btn-primary mt-2">
              <i class="bi bi-eye me-1"></i>Ver en inventario
            </a>
          </p>
        `;
      } else {
        // Producto no encontrado - ofrecer crear uno nuevo
        universalQrResult.className = 'mb-3 alert alert-warning';
        universalQrResult.innerHTML = `
          <h6 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i>Producto no encontrado</h6>
          <p class="mb-2">El código <strong>"${decodedText}"</strong> no está registrado en el inventario.</p>
          <p class="mb-0">
            <a href="/inventario?nuevo=${encodeURIComponent(decodedText)}" class="btn btn-sm btn-primary mt-2">
              <i class="bi bi-plus-circle me-1"></i>Crear producto con este código
            </a>
          </p>
        `;
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      universalQrResult.className = 'mb-3 alert alert-danger';
      universalQrResult.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error al buscar el producto. Intenta nuevamente.
      `;
    }
  }
});

