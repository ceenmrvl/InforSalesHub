/**
 * Extensión de Entrada Rápida (Quick Entry) para Infor Sales Hub.
 * Soporta conversión de artículos de peso fijo (MMS025MI) y desglose de peso variable.
 */
var SHIntegration;
(function (SHIntegration) {
    class QuickEntryProductConversion {
        // Parámetros de control de seguridad CSRF nativos de Infor
        #csrf_key = 'm3api-csrf';
        #csrf_entrytime = 'm3api-csrf-entrytime';
        #csrf_max_age = 59000;
        /**
         * Intercepta el código escaneado o digitado para resolver el artículo y su cantidad.
         */
        convertProduct(productCode) {
            const promise = $.Deferred();
            // Sanitización del código de barras de entrada
            var barcode = productCode ? String(productCode).trim() : "";
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                // Obtención de la empresa (CONO) dinámica desde el contexto de la sesión activa
                var currentCono = window.SalesHub?.UserContext?.Company || "300";
                // --- CASO 1: CÓDIGO DE PESO VARIABLE (Prefijo 8 y longitud exacta de EAN13) ---
                if (barcode.startsWith("8") && barcode.length === 13) {
                    // Desglose directo de la estructura del código de barras
                    var extractedItem = barcode.substring(1, 7);
                    var rawWeight = barcode.substring(7, 12);
                    var calculatedQuantity = (parseFloat(rawWeight) / 1000).toString();
                    console.log(`[SalesHub QuickEntry] Peso Variable - Artículo: ${extractedItem}, Cantidad: ${calculatedQuantity} KG`);
                    promise.resolve({
                        itemNumber: extractedItem,
                        quantity: calculatedQuantity
                    });
                }
                // --- CASO 2: CÓDIGO DE PESO FIJO (Prefijo 7 o flujos estándar) ---
                else {
                    var url = `${this.#getBaseURL()}/m3api-rest/v2/execute/MMS025MI/GetItem?ALWT=2&POPN=${barcode}&CONO=${currentCono}&ALWQ=EA13&dateformat=YMD8&excludeempty=false&righttrim=true&format=PRETTY&extendedresult=false`;
                    this.#executeM3API(url).then(function (response) {
                        if (response && response.results && response.results && response.results.records) {
                            var records = response.results.records;
                            if (Array.isArray(records) && records.length > 0) {
                                var record = records;
                                if (record && record.ITNO) {
                                    var shortItemNumber = record.ITNO.trim();
                                    console.log(`[SalesHub QuickEntry] Peso Fijo - Traducido a: ${shortItemNumber}`);
                                    promise.resolve({
                                        itemNumber: shortItemNumber,
                                        quantity: "1"
                                    });
                                    return;
                                }
                            }
                        }
                        // Fallback: Si no hay registro válido en M3, se pasa el código original
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    }, function (error) {
                        console.error("[SalesHub QuickEntry] Error en consulta de peso fijo hacia M3:", error);
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    });
                }
            }
            else {
                promise.resolve({ itemNumber: productCode, quantity: "1" });
            }
            return promise;
        }
        // --- MÉTODOS NATIVOS DE CONEXIÓN CON GESTIÓN DE TOKENS (REPLICADOS DEL SDK) ---
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
