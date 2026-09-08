var SHIntegration;
(function (SHIntegration) {
    class QuickEntryProductConversion {
        #csrf_key = 'm3api-csrf';
        #csrf_entrytime = 'm3api-csrf-entrytime';
        #csrf_max_age = 59000;
        convertProduct(productCode) {
            const promise = $.Deferred();
            var barcode = productCode ? productCode.trim() : "";
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var currentCono = window.SalesHub?.UserContext?.Company || "";
                var currentDivi = window.SalesHub?.UserContext?.Division || "";
                // Configuración basada exactamente en la documentación de tu API disponible:
                // Cambiamos a la transacción GetItem y usamos los parámetros ALWT y POPN
                var url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS025MI/GetItem?ALWT=EA13&POPN=${barcode}`;
                if (currentCono)
                    url += `&CONO=${currentCono}`;
                if (currentDivi)
                    url += `&DIVI=${currentDivi}`;
                this.#executeM3API(url).then(function (response) {
                    // El framework REST de Infor CloudSuite entrega el arreglo en response.results.records
                    if (response && response.results && response.results && response.results.records) {
                        var records = response.results.records;
                        var record = Array.isArray(records) ? records : records;
                        // Si la transacción GetItem devuelve el número de artículo en ITNO, lo resolvemos
                        if (record && record.ITNO) {
                            promise.resolve({
                                itemNumber: record.ITNO.trim(),
                                quantity: "1"
                            });
                            return;
                        }
                    }
                    // Si la API responde pero el registro no tiene ITNO o no existe, dejamos pasar el original
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                }, function (error) {
                    console.error("Error al consultar el Alias en MMS025MI/GetItem:", error);
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
        // En ambientes de prueba locales o Cloud, hereda automáticamente la base de tu URL (/EVHLDK...)
        #getBaseURL() {
            return `${window.location.protocol}//${window.location.host}`;
        }
    }
    SHIntegration.QuickEntryProductConversion = QuickEntryProductConversion;
})(SHIntegration || (SHIntegration = {}));
