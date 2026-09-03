/**
 * Script de conversión para Infor Sales Hub - Quick Entry
 * Traduce códigos EAN13 a su número de artículo único (ITNO)
 */
(function () {
    return {
        /**
         * Función principal disparada por el punto de salida
         * @param {string} input - El código escaneado o ingresado (EAN13)
         * @returns {Promise} Debe retornar un objeto { itemNumber: string, quantity: number }
         */
        execute: function (input) {
            return new Promise(function (resolve, reject) {
                // Limpiar espacios en blanco
                var barcode = input ? input.trim() : "";

                // Regla: Si es un código EAN13 (usualmente 13 dígitos numéricos)
                if (barcode.length === 13 && !isNaN(barcode)) {
                    
                    // Llamamos a la transacción GetItmBasic de MMS200MI para resolver el código de barras
                    // O bien, consumimos el servicio de consulta de alias de M3 (MITPOP)
                    var request = {
                        program: "MMS200MI",
                        transaction: "GetItmBasic",
                        record: { 
                            ALAN: barcode // Consulta de alias / código EAN
                        }
                    };

                    // Ejecución del servicio MI a través de Sales Hub
                    SalesHubRestService.executeMI(request)
                        .then(function (response) {
                            if (response && response.item && response.item.ITNO) {
                                // Devolvemos el número de artículo real y la cantidad por defecto (1)
                                resolve({
                                    itemNumber: response.item.ITNO,
                                    quantity: 1
                                });
                            } else {
                                // Si no se encuentra traducción, devolvemos la entrada original
                                resolve({
                                    itemNumber: barcode,
                                    quantity: 1
                                });
                            }
                        })
                        .catch(function (error) {
                            console.error("Error al consultar el EAN13 en M3:", error);
                            // En caso de fallo, dejamos que Sales Hub intente procesar el input original
                            resolve({
                                itemNumber: barcode,
                                quantity: 1
                            });
                        });
                } else {
                    // Si no cumple con el formato EAN13, se procesa de forma nativa sin cambios
                    resolve({
                        itemNumber: barcode,
                        quantity: 1
                    });
                }
            });
        }
    };
})();