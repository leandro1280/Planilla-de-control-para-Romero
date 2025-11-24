document.addEventListener('DOMContentLoaded', function () {
    // --- GENERACIÓN DE QR (Visualización) ---
    const qrButtons = document.querySelectorAll('.btn-qr');
    const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
    const qrContainer = document.getElementById('qr-code-container');
    const qrReferencia = document.getElementById('qr-referencia');
    const qrNombre = document.getElementById('qr-nombre');
    let qrCodeObj = null;

    qrButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const referencia = this.dataset.referencia;
            const nombre = this.dataset.nombre;

            // Limpiar QR anterior
            qrContainer.innerHTML = '';
            qrReferencia.textContent = referencia;
            qrNombre.textContent = nombre;

            // Generar nuevo QR
            qrCodeObj = new QRCode(qrContainer, {
                text: referencia,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            qrModal.show();
        });
    });

    // --- ESCANEO DE QR (Lógica Pro "Apunta y Dispara") ---
    const scanModalEl = document.getElementById('scanModal');
    // Configuración Bootstrap del modal (keyboard: false evita cierres accidentales)
    const scanModal = new bootstrap.Modal(scanModalEl, { keyboard: false });
    
    const btnScanMovimiento = document.getElementById('btn-scan-qr');
    const btnScanNuevo = document.getElementById('btn-scan-qr-new');
    
    let html5QrCode = null;
    let targetInput = null;
    let isScanning = false;

    // Iniciar el escáner
    async function startScanner(inputElement) {
        targetInput = inputElement;
        scanModal.show();

        // Esperar a que el modal esté visible para iniciar la cámara
        // Esto es CRÍTICO para que el contenedor tenga dimensiones reales
        scanModalEl.addEventListener('shown.bs.modal', initCamera, { once: true });
    }

    async function initCamera() {
        if (isScanning) return;

        // Verificar que Html5Qrcode esté disponible
        if (typeof Html5Qrcode === 'undefined') {
            console.error('Html5Qrcode no está disponible');
            alert('Error: El escáner QR no está disponible. Recarga la página.');
            scanModal.hide();
            return;
        }

        try {
            html5QrCode = new Html5Qrcode("reader");
            
            // Detectar si es móvil
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
            
            // Configuración responsive
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            let qrboxSize = 250; // Default
            
            if (isMobile) {
                // En móvil, usar 70% del viewport más pequeño
                qrboxSize = Math.max(200, Math.min(viewportWidth, viewportHeight) * 0.7);
            }
            
            const config = { 
                fps: isMobile ? 20 : 10, 
                qrbox: { width: qrboxSize, height: qrboxSize },
                aspectRatio: 1.0,
                disableFlip: false
            };

            // Intentar con facingMode primero
            try {
                await html5QrCode.start(
                    { facingMode: isMobile ? "environment" : "user" }, 
                    config, 
                    onScanSuccess, 
                    onScanFailure
                );
            } catch (facingModeError) {
                // Si falla, intentar obtener lista de cámaras
                console.warn('Error con facingMode, intentando con lista de cámaras:', facingModeError);
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length > 0) {
                    const rearCamera = cameras.find(cam => 
                        cam.label.toLowerCase().includes('back') || 
                        cam.label.toLowerCase().includes('environment') ||
                        cam.label.toLowerCase().includes('rear')
                    );
                    await html5QrCode.start(
                        rearCamera ? rearCamera.id : cameras[0].id,
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                } else {
                    throw facingModeError;
                }
            }
            
            isScanning = true;
            document.body.classList.add('qr-scanning-active');

        } catch (err) {
            console.error("Error iniciando cámara: ", err);
            alert("No se pudo acceder a la cámara. Asegúrate de dar permisos y que la cámara no esté en uso por otra aplicación.");
            scanModal.hide();
        }
    }

    async function stopCamera() {
        if (html5QrCode && isScanning) {
            try {
                await html5QrCode.stop();
                html5QrCode.clear();
                isScanning = false;
                document.body.classList.remove('qr-scanning-active');
            } catch (err) {
                console.error("Error deteniendo cámara: ", err);
            }
        }
    }

    function onScanSuccess(decodedText, decodedResult) {
        // Éxito: Vibrar si el dispositivo lo soporta
        if (navigator.vibrate) navigator.vibrate(200);

        stopCamera().then(() => {
            scanModal.hide();
            processResult(decodedText);
        });
    }

    function onScanFailure(error) {
        // Ignorar errores de frame vacíos, es normal mientras busca
    }

    function processResult(text) {
        if (!targetInput) return;

        // Caso 1: Es un SELECT (Formulario Movimientos)
        if (targetInput.tagName === 'SELECT') {
            const options = Array.from(targetInput.options);
            // Búsqueda exacta
            let matchingOption = options.find(opt => opt.value === text);
            
            // Si no encuentra exacto, buscar si el texto contiene la referencia (para URLs completas)
            if (!matchingOption) {
                 matchingOption = options.find(opt => text.includes(opt.value) && opt.value.length > 3);
            }

            if (matchingOption) {
                targetInput.value = matchingOption.value;
                targetInput.dispatchEvent(new Event('change')); // Activar lógica dependiente
                flashSuccess(targetInput);
            } else {
                alert(`Producto no encontrado: ${text}`);
            }
        } 
        // Caso 2: Es un INPUT (Formulario Nuevo Producto)
        else {
            targetInput.value = text;
            flashSuccess(targetInput);
        }
    }

    // Efecto visual de éxito en el input
    function flashSuccess(element) {
        element.classList.add('is-valid', 'bg-success', 'text-white', 'bg-opacity-25');
        setTimeout(() => {
            element.classList.remove('is-valid', 'bg-success', 'text-white', 'bg-opacity-25');
        }, 2000);
    }

    // Event Listeners Botones
    if (btnScanMovimiento) {
        btnScanMovimiento.addEventListener('click', () => {
            startScanner(document.getElementById('movimiento-referencia'));
        });
    }

    if (btnScanNuevo) {
        btnScanNuevo.addEventListener('click', () => {
            // El botón está junto al input en un input-group
            const input = btnScanNuevo.previousElementSibling;
            startScanner(input);
        });
    }

    // Limpieza al cerrar el modal
    scanModalEl.addEventListener('hidden.bs.modal', () => {
        stopCamera();
    });
});
