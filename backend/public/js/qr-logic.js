document.addEventListener('DOMContentLoaded', function () {
    // --- GENERACIÓN DE QR ---
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

    // --- ESCANEO DE QR ---
    const scanModalEl = document.getElementById('scanModal');
    const scanModal = new bootstrap.Modal(scanModalEl);
    const btnScanMovimiento = document.getElementById('btn-scan-qr');
    const btnScanNuevo = document.getElementById('btn-scan-qr-new');
    let html5QrcodeScanner = null;
    let targetInput = null; // Elemento donde se pondrá el valor escaneado

    function startScanner(inputElement) {
        targetInput = inputElement;
        scanModal.show();

        // Esperar a que el modal se muestre para iniciar el scanner
        scanModalEl.addEventListener('shown.bs.modal', initScanner, { once: true });
    }

    function initScanner() {
        if (html5QrcodeScanner) {
            // Si ya existe, nos aseguramos de que esté limpio
            html5QrcodeScanner.clear();
        }

        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }

    function onScanSuccess(decodedText, decodedResult) {
        // Detener el scanner
        html5QrcodeScanner.clear().then(() => {
            scanModal.hide();

            if (targetInput) {
                // Si es un select (movimiento), buscar la opción
                if (targetInput.tagName === 'SELECT') {
                    const options = Array.from(targetInput.options);
                    const matchingOption = options.find(opt => opt.value === decodedText);

                    if (matchingOption) {
                        targetInput.value = decodedText;
                        // Disparar evento change por si hay lógica dependiente
                        targetInput.dispatchEvent(new Event('change'));

                        // Feedback visual
                        targetInput.classList.add('is-valid');
                        setTimeout(() => targetInput.classList.remove('is-valid'), 2000);
                    } else {
                        alert(`El producto con referencia "${decodedText}" no se encuentra en la lista.`);
                    }
                } else {
                    // Si es input normal (nuevo producto)
                    targetInput.value = decodedText;
                    targetInput.classList.add('is-valid');
                    setTimeout(() => targetInput.classList.remove('is-valid'), 2000);
                }
            }
        }).catch(err => {
            console.error("Error al detener el scanner", err);
            scanModal.hide();
        });
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    }

    // Event Listeners para botones de escaneo
    if (btnScanMovimiento) {
        btnScanMovimiento.addEventListener('click', () => {
            const select = document.getElementById('movimiento-referencia');
            startScanner(select);
        });
    }

    if (btnScanNuevo) {
        btnScanNuevo.addEventListener('click', () => {
            // Buscar el input de referencia dentro del formulario de nuevo producto
            // El botón está dentro de un input-group, el input es el hermano anterior
            const input = btnScanNuevo.previousElementSibling;
            startScanner(input);
        });
    }

    // Limpiar scanner al cerrar modal (por si el usuario cierra manual)
    scanModalEl.addEventListener('hidden.bs.modal', () => {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        }
    });
});
