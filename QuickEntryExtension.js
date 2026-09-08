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
                var url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS025MI/GetItem?ALWT=2&POPN=${barcode}&CONO=300&ALWQ=EA13&dateformat=YMD8&excludeempty=false&righttrim=true&format=PRETTY&extendedresult=false`;
                console.log("[SalesHub Extension] -> Consultando pasarela REST nativa:", url);
                this.#executeM3API(url).then(function (response) {
                    console.log("[SalesHub Extension] -> Respuesta del servidor recibida:", response);
                    if (response && response.results && response.results[0] && response.results[0].records) {
                        // Accedemos al primer elemento del arreglo de registros tal como muestra tu consola [{...}]
                        var record = response.results[0].records[0] || response.results[0].records;
                        console.log("[SalesHub Extension] -> Objeto de registro M3 extraído:", record);
                        if (record && record.ITNO) {
                            var shortItemNumber = record.ITNO.trim();
                            console.log("[SalesHub Extension] -> ¡ÉXITO! Artículo traducido correctamente:", shortItemNumber);
                            promise.resolve({
                                itemNumber: shortItemNumber,
                                quantity: "1",
								isConverted: true
                            });
                            return;
                        }
                    }
                    console.warn("[SalesHub Extension] -> El alias no devolvió registros válidos. Pasando código original.");
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                }, function (error) {
                    console.error("[SalesHub Extension] -> ERROR de comunicación con M3:", error);
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                });
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
