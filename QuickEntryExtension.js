var SHIntegration;
(function (SHIntegration) {
    class QuickEntryProductConversion {
        #csrf_key = 'm3api-csrf';
        #csrf_entrytime = 'm3api-csrf-entrytime';
        #csrf_max_age = 59000;
        convertProduct(productCode) {
            const promise = $.Deferred();
            var barcode = productCode ? productCode.trim() : "";
            console.log("[SalesHub Extension] -> 1. Entrada detectada en Quick Entry. Código original:", barcode);
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var currentCono = window.SalesHub?.UserContext?.Company || "";
                var currentDivi = window.SalesHub?.UserContext?.Division || "";
                var url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS025MI/GetItem?ALWT=EA13&POPN=${barcode}`;
                if (currentCono)
                    url += `&CONO=${currentCono}`;
                if (currentDivi)
                    url += `&DIVI=${currentDivi}`;
                console.log("[SalesHub Extension] -> 2. Lanzando petición HTTP a M3 de forma nativa. URL destino:", url);
                this.#executeM3API(url).then(function (response) {
                    console.log("[SalesHub Extension] -> 3. Respuesta JSON cruda recibida de M3:", response);
                    if (response && response.results && response.results.records) {
                        var records = response.results.records;
                        // Si la respuesta es un arreglo, tomamos el primer objeto; de lo contrario, el objeto directo
                        var record = Array.isArray(records) ? records[0] : records;
                        console.log("[SalesHub Extension] -> 4. Registro extraído para evaluación:", record);
                        // Validamos si el campo con el código de artículo corto existe en este JSON
                        if (record) {
                            // Imprimimos todas las llaves disponibles por si el ERP usa otro nombre (ej. MMITNO o ITNO)
                            console.log("[SalesHub Extension] -> 5. Campos disponibles en el registro M3:", Object.keys(record));
                            var finalItem = record.ITNO || record.MMITNO;
                            if (finalItem) {
                                console.log("[SalesHub Extension] -> ¡ÉXITO! Artículo encontrado en M3:", finalItem.trim());
                                promise.resolve({
                                    itemNumber: finalItem.trim(),
                                    quantity: "1"
                                });
                                return;
                            }
                            else {
                                console.warn("[SalesHub Extension] -> Alerta: El registro no contiene la propiedad ITNO ni MMITNO.");
                            }
                        }
                    }
                    else {
                        console.warn("[SalesHub Extension] -> Alerta: La estructura de respuesta no contiene 'results.records'.");
                    }
                    console.log("[SalesHub Extension] -> 6. No se pudo mapear un artículo. Devolviendo código original escaneado.");
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                }, function (error) {
                    console.error("[SalesHub Extension] -> ERROR: Falló la comunicación asíncrona con el gateway REST:", error);
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                });
            }
            else {
                console.log("[SalesHub Extension] -> Código omitido (vacío o no numérico). Procesando flujo estándar.");
                promise.resolve({ itemNumber: productCode, quantity: "1" });
            }
            return promise;
        }
        // --- MÉTODOS NATIVOS DE CONEXIÓN ---
        #executeM3API(url) {
            if (this.#isCsrfExpired()) {
                console.log("[SalesHub Extension] -> Token CSRF expirado o ausente. Solicitando uno nuevo...");
                return this.#refreshCsrfToken().then(() => {
                    return this.#executeHttp(url);
                });
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
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                url: `${this.#getBaseURL()}/m3api-rest/csrf`,
                success: (data) => {
                    console.log("[SalesHub Extension] -> Nuevo token CSRF guardado en sesión.");
                    sessionStorage.setItem(this.#csrf_entrytime, Date.now().toString());
                    sessionStorage.setItem(this.#csrf_key, data);
                    return data;
                },
            });
        }
        #isCsrfExpired() {
            const entryTime = sessionStorage.getItem(this.#csrf_entrytime);
            if (!sessionStorage.getItem(this.#csrf_key) || !entryTime) {
                return true;
            }
            return Date.now() - Number(entryTime) > this.#csrf_max_age;
        }
        #getBaseURL() {
            return `${window.location.protocol}//${window.location.host}`;
        }
    }
    SHIntegration.QuickEntryProductConversion = QuickEntryProductConversion;
})(SHIntegration || (SHIntegration = {}));
