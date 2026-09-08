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
                const url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS200MI/GetItmByAlias?ALAN=${barcode}&ALTY=EA13`;
                // Pasamos el control de éxito y de error dentro del mismo .then() para cumplir con PromiseLike
                this.#executeM3API(url).then(function (response) {
                    if (response && response.results && response.results[0] && response.results[0].records && response.results[0].records[0]) {
                        var record = response.results[0].records[0];
                        if (record && record.ITNO) {
                            promise.resolve({
                                itemNumber: record.ITNO.trim(),
                                quantity: "1"
                            });
                            return;
                        }
                    }
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                }, function (error) {
                    console.error("Error al consultar el Alias en M3 mediante pasarela nativa:", error);
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                });
            }
            else {
                promise.resolve({ itemNumber: productCode, quantity: "1" });
            }
            return promise;
        }
        // --- MÉTODOS NATIVOS DE CONEXIÓN EXTRAÍDOS DE TU EJEMPLO ---
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
        #getBaseURL() {
            return `${window.location.protocol}//${window.location.host}`;
        }
    }
    SHIntegration.QuickEntryProductConversion = QuickEntryProductConversion;
})(SHIntegration || (SHIntegration = {}));
