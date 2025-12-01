// Escáner QR Universal - Optimizado para móvil (Fullscreen intuitivo)
document.addEventListener('DOMContentLoaded', function () {
  // Verificar que Html5Qrcode esté disponible
  if (typeof Html5Qrcode === 'undefined') {
    console.error('❌ Html5Qrcode no está disponible. Verifica que el script se haya cargado correctamente.');
    return;
  }

  const btnQrUniversal = document.getElementById('btn-qr-universal');
  const universalQrModalEl = document.getElementById('universalQrModal');
  
  if (!universalQrModalEl) {
    console.warn('Modal QR universal no encontrado');
    return;
  }

  const universalQrModal = new bootstrap.Modal(universalQrModalEl, {
    backdrop: 'static',
    keyboard: false
  });
  const universalQrScanner = document.getElementById('universal-qr-scanner');
  const universalQrResult = document.getElementById('universal-qr-result');
  const qrLoading = document.getElementById('qr-loading');
  let html5QrCode = null;
  let isScanning = false;

  // Detectar si es móvil (mejorado)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Botón del navbar para abrir el escáner universal
  if (btnQrUniversal) {
    btnQrUniversal.addEventListener('click', function () {
      universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 d-none';
      universalQrResult.innerHTML = '';
      if (qrLoading) qrLoading.style.display = 'block';
      universalQrModal.show();
    });
  }

  // Inicializar escáner cuando se abre el modal
  const universalQrModalElement = document.getElementById('universalQrModal');
  if (universalQrModalElement) {
    universalQrModalElement.addEventListener('shown.bs.modal', async () => {
      if (isScanning && html5QrCode) {
        await html5QrCode.stop().catch(() => {});
        html5QrCode.clear();
        isScanning = false;
      }

      // Limpiar y preparar contenedor
      universalQrScanner.innerHTML = '<div id="reader-universal" class="w-100 h-100"></div>';
      
      // Ocultar loading después de un momento
      setTimeout(() => {
        if (qrLoading) qrLoading.style.display = 'none';
      }, 500);

      // Esperar un momento para que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar que el contenedor existe
      if (!document.getElementById('reader-universal')) {
        console.error('Contenedor reader-universal no encontrado');
        return;
      }

      html5QrCode = new Html5Qrcode('reader-universal');

      try {
        // Intentar obtener cámaras
        let videoInputDevices = [];
        try {
          videoInputDevices = await Html5Qrcode.getCameras();
        } catch (camError) {
          console.warn('Error obteniendo lista de cámaras, intentando con facingMode:', camError);
          // Si falla, intentar directamente con facingMode
          await startWithFacingMode();
          return;
        }
        
        if (videoInputDevices && videoInputDevices.length > 0) {
          // Preferir cámara trasera en móviles
          const rearCamera = videoInputDevices.find(device => {
            const label = device.label.toLowerCase();
            return label.includes('back') || 
                   label.includes('environment') || 
                   label.includes('rear') ||
                   label.includes('trasera');
          });
          
          const cameraId = rearCamera ? rearCamera.id : videoInputDevices[0].id;

          // Configuración responsive para QR box
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          let qrboxSize = 300; // Default desktop
          
          if (isMobile) {
            // En móvil, usar el 80% del viewport más pequeño, mínimo 200px
            qrboxSize = Math.max(200, Math.min(viewportWidth, viewportHeight) * 0.8);
          } else {
            // En desktop, limitar a 400px máximo
            qrboxSize = Math.min(400, viewportWidth * 0.5);
          }

          const config = {
            fps: isMobile ? 20 : 10, // Más FPS en móvil
            qrbox: { width: qrboxSize, height: qrboxSize },
            aspectRatio: 1.0,
            disableFlip: false, // Permitir rotación
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          };

          // Configuración de video
          const videoConstraints = {
            facingMode: rearCamera ? "environment" : "user",
            width: { ideal: isMobile ? 640 : 1280 },
            height: { ideal: isMobile ? 480 : 720 }
          };

          html5QrCode.start(
            cameraId,
            config,
            (decodedText, decodedResult) => {
              onUniversalScanSuccess(decodedText, decodedResult);
            },
            (errorMessage) => {
              // Ignorar errores de escaneo continuo (es normal mientras busca)
            }
          ).then(() => {
            isScanning = true;
            if (qrLoading) qrLoading.style.display = 'none';
            document.body.classList.add('qr-scanning-active');
          }).catch((err) => {
            console.error('Error al iniciar el escáner:', err);
            // Si falla con cameraId, intentar con facingMode
            if (err.message && err.message.includes('camera')) {
              startWithFacingMode();
            } else {
              showError('Error al iniciar la cámara', 'Asegúrate de dar permisos de cámara y que no esté en uso por otra aplicación.');
            }
          });
        } else {
          // Si no hay cámaras en la lista, intentar con facingMode
          await startWithFacingMode();
        }
      } catch (error) {
        console.error('Error al obtener cámaras:', error);
        // Intentar con facingMode como fallback
        await startWithFacingMode();
      }

      // Función auxiliar para iniciar con facingMode (más compatible)
      async function startWithFacingMode() {
        try {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          let qrboxSize = isMobile 
            ? Math.max(200, Math.min(viewportWidth, viewportHeight) * 0.8)
            : Math.min(400, viewportWidth * 0.5);

          const config = {
            fps: isMobile ? 20 : 10,
            qrbox: { width: qrboxSize, height: qrboxSize },
            aspectRatio: 1.0,
            disableFlip: false
          };

          await html5QrCode.start(
            { facingMode: isMobile ? "environment" : "user" },
            config,
            (decodedText, decodedResult) => {
              onUniversalScanSuccess(decodedText, decodedResult);
            },
            (errorMessage) => {
              // Ignorar errores de escaneo continuo
            }
          );
          
          isScanning = true;
          if (qrLoading) qrLoading.style.display = 'none';
          document.body.classList.add('qr-scanning-active');
        } catch (err) {
          console.error('Error iniciando con facingMode:', err);
          showError('Error al acceder a las cámaras', err.message || 'No se pudo acceder a la cámara. Verifica los permisos.');
        }
      }

      // Función auxiliar para mostrar errores
      function showError(title, message) {
        isScanning = false;
        if (qrLoading) qrLoading.style.display = 'none';
        if (universalQrResult) {
          universalQrResult.classList.remove('d-none');
          universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 alert alert-danger';
          universalQrResult.style.marginTop = '60px';
          universalQrResult.innerHTML = `
            <div class="d-flex align-items-start">
              <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>
                <strong>${title}</strong><br>
                <small>${message}</small>
              </div>
            </div>
          `;
        }
      }
    });

    // Detener escáner cuando se cierra el modal
    universalQrModalElement.addEventListener('hidden.bs.modal', async () => {
      if (html5QrCode && isScanning) {
        try {
          await html5QrCode.stop().catch(err => console.error('Error al detener el scanner:', err));
          html5QrCode.clear();
          isScanning = false;
          document.body.classList.remove('qr-scanning-active');
        } catch (err) {
          console.error('Error limpiando scanner:', err);
        }
      }
      universalQrScanner.innerHTML = '';
      if (qrLoading) qrLoading.style.display = 'block';
    });
  }

  // Función que se ejecuta cuando se escanea un código
  async function onUniversalScanSuccess(decodedText, decodedResult) {
    // Detener el escáner
    if (html5QrCode && isScanning) {
      isScanning = false;
      document.body.classList.remove('qr-scanning-active');
      await html5QrCode.stop().catch(err => console.error('Error al detener el scanner:', err));
      html5QrCode.clear();
    }

    // Feedback háptico (vibración más fuerte)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Vibrar dos veces para confirmar
    }

    // Sonido de éxito (si está disponible)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Ignorar errores de audio
    }

    // Mostrar el código escaneado
    universalQrResult.classList.remove('d-none');
    universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 alert alert-info';
    universalQrResult.style.marginTop = '60px !important';
    universalQrResult.innerHTML = `
      <div class="d-flex align-items-start">
        <i class="bi bi-qr-code me-2 fs-5"></i>
        <div class="flex-grow-1">
          <strong>Código escaneado:</strong><br>
          <code class="d-block mt-2 p-2 bg-white rounded text-break">${decodedText}</code>
          <small class="d-block mt-2 text-muted">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Buscando producto en el inventario...
          </small>
        </div>
      </div>
    `;

    // Buscar primero si es una máquina, luego producto
    try {
      // Intentar buscar máquina primero
      let isMachine = false;
      try {
        const machineResponse = await fetch(`/maquinas/api/qr/${encodeURIComponent(decodedText)}`);
        if (machineResponse.ok) {
          const machineData = await machineResponse.json();
          if (machineData.success && machineData.data.maquina) {
            isMachine = true;
            const maquina = machineData.data.maquina;
            
            // Máquina encontrada - éxito
            universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 alert alert-success';
            universalQrResult.style.marginTop = '60px !important';
            universalQrResult.innerHTML = `
              <h6 class="alert-heading d-flex align-items-center">
                <i class="bi bi-gear-fill me-2 fs-5"></i>
                Máquina encontrada
              </h6>
              <p class="mb-1"><strong>Código:</strong> ${maquina.codigo}</p>
              <p class="mb-1"><strong>Nombre:</strong> ${maquina.nombre}</p>
              ${maquina.ubicacion ? `<p class="mb-1"><strong>Ubicación:</strong> ${maquina.ubicacion}</p>` : ''}
              ${maquina.repuestos && maquina.repuestos.length > 0 ? `<p class="mb-2"><strong>Repuestos:</strong> ${maquina.repuestos.length} repuesto(s) asociado(s)</p>` : ''}
              <div class="d-grid gap-2">
                <a href="/maquinas/qr/${encodeURIComponent(maquina.codigo)}" class="btn btn-sm btn-primary">
                  <i class="bi bi-eye me-1"></i>Ver detalles y mantenimientos
                </a>
              </div>
            `;
            
            // Auto-cerrar después de 3 segundos y redirigir
            setTimeout(() => {
              universalQrModal.hide();
              window.location.href = `/maquinas/qr/${encodeURIComponent(maquina.codigo)}`;
            }, 2000);
            return;
          }
        }
      } catch (machineError) {
        // Si falla la búsqueda de máquina, continuar con producto
        console.log('No es una máquina, buscando producto...');
      }

      // Si no es máquina, buscar producto
      const response = await fetch(`/inventario/productos/buscar?codigo=${encodeURIComponent(decodedText)}`);
      const data = await response.json();

      if (data.success && data.producto) {
        // Producto encontrado - éxito
        universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 alert alert-success';
        universalQrResult.style.marginTop = '60px !important';
        universalQrResult.innerHTML = `
          <h6 class="alert-heading d-flex align-items-center">
            <i class="bi bi-check-circle-fill me-2 fs-5"></i>
            Producto encontrado
          </h6>
          <p class="mb-1"><strong>Referencia:</strong> ${data.producto.referencia}</p>
          <p class="mb-1"><strong>Nombre:</strong> ${data.producto.nombre}</p>
          <p class="mb-2">
            <strong>Stock:</strong> 
            <span class="badge ${data.producto.existencia === 0 ? 'bg-danger' : data.producto.existencia <= 4 ? 'bg-warning' : 'bg-success'}">
              ${data.producto.existencia}
            </span>
          </p>
          <div class="d-grid gap-2">
            <a href="/inventario?busqueda=${encodeURIComponent(data.producto.referencia)}" class="btn btn-sm btn-primary">
              <i class="bi bi-eye me-1"></i>Ver en inventario
            </a>
          </div>
        `;
        
        // Auto-cerrar después de 3 segundos (opcional)
        setTimeout(() => {
          universalQrModal.hide();
        }, 3000);
      } else {
        // Producto no encontrado - ofrecer crear uno nuevo
        universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 alert alert-warning';
        universalQrResult.style.marginTop = '60px !important';
        universalQrResult.innerHTML = `
          <h6 class="alert-heading d-flex align-items-center">
            <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            Producto no encontrado
          </h6>
          <p class="mb-2">El código <strong>"${decodedText.substring(0, 30)}${decodedText.length > 30 ? '...' : ''}"</strong> no está registrado.</p>
          <div class="d-grid gap-2">
            <a href="/inventario?nuevo=${encodeURIComponent(decodedText)}" class="btn btn-sm btn-primary">
              <i class="bi bi-plus-circle me-1"></i>Crear producto con este código
            </a>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="location.reload()">
              <i class="bi bi-arrow-clockwise me-1"></i>Escanear otro código
            </button>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error al buscar producto:', error);
      universalQrResult.className = 'position-absolute top-0 start-0 end-0 z-3 m-3 alert alert-danger';
      universalQrResult.style.marginTop = '60px !important';
      universalQrResult.innerHTML = `
        <div class="d-flex align-items-start">
          <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          <div>
            <strong>Error al buscar el producto</strong><br>
            <small>Intenta nuevamente o verifica tu conexión.</small>
          </div>
        </div>
      `;
    }
  }
});

