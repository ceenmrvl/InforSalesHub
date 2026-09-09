var SHIntegration;
(function (SHIntegration) {
    class QuickEntryProductConversion {
        #csrf_key = 'm3api-csrf';
        #csrf_entrytime = 'm3api-csrf-entrytime';
        #csrf_max_age = 59000;
        convertProduct(productCode) {
            const promise = $.Deferred();
            var barcode = productCode ? productCode.trim() : "";
            console.log("[SalesHub Extension] -> Entrada detectada. Procesando código:", barcode);
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var currentCono = window.SalesHub?.UserContext?.Company || "300";
                // --- CASO 1: CÓDIGO DE PESO VARIABLE (Inicia con 8 y tiene 13 dígitos) ---
                if (barcode.indexOf("8") === 0 && barcode.length === 13) {
                    console.log("[SalesHub Extension] -> [PESO VARIABLE] Detectado prefijo 8.");
                    // Extraemos los 6 dígitos del artículo directamente (desde la posición 1 hasta la 6)
                    var extractedItem = barcode.substring(1, 7);
                    // Extraemos los 5 dígitos del peso (desde la posición 7 hasta la 11) y lo convertimos a decimal (KG)
                    var rawWeight = barcode.substring(7, 12);
                    var calculatedQuantity = (parseFloat(rawWeight) / 1000).toString();
                    console.log(`[SalesHub Extension] -> [PESO VARIABLE] Éxito inmediato. Artículo: ${extractedItem}, Cantidad: ${calculatedQuantity} KG`);
                    // Devolvemos el resultado directamente sin consultar la API
                    promise.resolve({
                        itemNumber: extractedItem,
                        quantity: calculatedQuantity
                    });
                }
                // --- CASO 2: CÓDIGO DE PESO FIJO (Inicia con 7 u otros flujos estándar) ---
                else {
                    console.log("[SalesHub Extension] -> [PESO FIJO] Procesando flujo estándar.");
                    var url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS025MI/GetItem?ALWT=2&POPN=${barcode}&CONO=${currentCono}&ALWQ=EA13&dateformat=YMD8&excludeempty=false&righttrim=true&format=PRETTY&extendedresult=false`;
                    this.#executeM3API(url).then(function (response) {
                        if (response && response.results && response.results && response.results.records) {
                            var records = response.results.records;
                            if (Array.isArray(records) && records.length > 0) {
                                // Solución técnica: Declaramos explícitamente como 'any' para evitar la queja de TypeScript
                                var record = records;
                                if (record && record.ITNO) {
                                    var shortItemNumber = record.ITNO.trim();
                                    console.log("[SalesHub Extension] -> [PESO FIJO] ¡ÉXITO! Artículo traducido:", shortItemNumber);
                                    promise.resolve({
                                        itemNumber: shortItemNumber,
                                        quantity: "1"
                                    });
                                    return;
                                }
                            }
                        }
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    }, function (error) {
                        console.error("[SalesHub Extension] -> ERROR en consulta de peso fijo:", error);
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
