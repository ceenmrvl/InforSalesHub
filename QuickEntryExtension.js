var SHIntegration;
(function (SHIntegration) {
    class QuickEntryProductConversion {
        #csrf_key = 'm3api-csrf';
        #csrf_entrytime = 'm3api-csrf-entrytime';
        #csrf_max_age = 59000;
        convertProduct(productCode) {
            const promise = $.Deferred();
            // Forzamos a que el código sea tratado siempre como un String limpio
            var barcode = productCode ? String(productCode).trim() : "";
            console.log("[SalesHub Extension] -> Entrada detectada. Procesando código:", barcode);
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var currentCono = window.SalesHub?.UserContext?.Company || "300";
                // --- CASO 1: CÓDIGO DE PESO VARIABLE (Inicia con 8 y tiene 13 dígitos) ---
                if (barcode.startsWith("8") && barcode.length === 13) {
                    console.log("[SalesHub Extension] -> [PESO VARIABLE] Detectado prefijo 8.");
                    // Extraemos los 6 dígitos del artículo directamente (posiciones de la 1 a la 6)
                    var extractedItem = barcode.substring(1, 7);
                    // Extraemos los 5 dígitos del peso (posiciones de la 7 a la 11) y lo dividimos entre 1000
                    var rawWeight = barcode.substring(7, 12);
                    var calculatedQuantity = (parseFloat(rawWeight) / 1000).toString();
                    console.log(`[SalesHub Extension] -> [PESO VARIABLE] Éxito inmediato. Artículo: ${extractedItem}, Cantidad: ${calculatedQuantity} KG`);
                    // Devolvemos el resultado al instante sin tocar la API de Infor
                    promise.resolve({
                        itemNumber: extractedItem,
                        quantity: calculatedQuantity
                    });
                }
                // --- CASO 2: CÓDIGO DE PESO FIJO (Cualquier otro caso, como el prefijo 7) ---
                else {
                    console.log("[SalesHub Extension] -> [PESO FIJO] Procesando flujo estándar.");
                    var url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS025MI/GetItem?ALWT=2&POPN=${barcode}&CONO=${currentCono}&ALWQ=EA13&dateformat=YMD8&excludeempty=false&righttrim=true&format=PRETTY&extendedresult=false`;
                    console.log("[SalesHub Extension] -> Consultando pasarela REST nativa:", url);
                    this.#executeM3API(url).then(function (response) {
                        console.log("[SalesHub Extension] -> Respuesta del servidor recibida:", response);
                        if (response && response.results && response.results[0] && response.results[0].records) {
                            var records = response.results[0].records;
                            // Replicamos exactamente la misma validación exacta que te funcionó
                            if (Array.isArray(records) && records.length > 0) {
                                var record = records[0]; // Forzamos a TypeScript a leer el índice 0 de forma dinámica
                                if (record && record.ITNO) {
                                    var shortItemNumber = record.ITNO.trim();
                                    console.log("[SalesHub Extension] -> ¡ÉXITO! Artículo traducido correctamente:", shortItemNumber);
                                    promise.resolve({
                                        itemNumber: shortItemNumber,
                                        quantity: "1"
                                    });
                                    return;
                                }
                            }
                        }
                        console.warn("[SalesHub Extension] -> El alias no devolvió registros válidos. Pasando código original.");
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    }, function (error) {
                        console.error("[SalesHub Extension] -> ERROR de comunicación con M3:", error);
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    });
                }
            }
            else {
                promise.resolve({ itemNumber: productCode, quantity: "1" });
            }
            return promise;
        }
        // --- MÉTODOS NATIVOS DE CONEXIÓN ---
        #executeM3API(url) {
            if (this.#isCsrfExpired()) {
                return this.#refreshCsrfToken().then(() => this.#executeHttp(url));
            }
            return this.#executeHttp(url);
        }
        #executeHttp(url) {
            const csrf = sessionStorage.getItem(this.#csrf_key);
            return $.ajax({
                type: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'fnd-csrf-token': csrf,
                },
                url: url,
                success: (data) => data,
                error: (error) => error,
            });
        }
        #refreshCsrfToken() {
            return $.ajax({
                type: 'GET',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                url: `${this.#getBaseURL()}/m3api-rest/csrf`,
                success: (data) => {
                    sessionStorage.setItem(this.#csrf_entrytime, Date.now().toString());
                    sessionStorage.setItem(this.#csrf_key, data);
                    return data;
                },
            });
        }
        #isCsrfExpired() {
            const entryTime = sessionStorage.getItem(this.#csrf_entrytime);
            if (!sessionStorage.getItem(this.#csrf_key) || !entryTime)
                return true;
            return Date.now() - Number(entryTime) > this.#csrf_max_age;
        }
        #getBaseURL() {
            return `${window.location.protocol}//${window.location.host}`;
        }
    }
    SHIntegration.QuickEntryProductConversion = QuickEntryProductConversion;
})(SHIntegration || (SHIntegration = {}));
