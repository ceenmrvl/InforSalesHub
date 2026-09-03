/**
 * Script de conversión oficial para Infor Sales Hub - Quick Entry
 * Traducción de Alias (EA13) a Número de Artículo M3 (ITNO)
 */

// Definición directa del objeto de conversión compatible con el cargador de Sales Hub
var QuickEntryConversionScript = {
    /**
     * Punto de entrada obligatorio para la conversión
     * @param {string} input - Código escaneado
     * @returns {Promise}
     */
    execute: function (input) {
        return new Promise(function (resolve, reject) {
            console.log("--> [SalesHub_Debug] Iniciando execute con input:", input);
            
            var barcode = input ? input.trim() : "";
            var prefix = "7";

            // Limpieza manual del prefijo asignado
            if (barcode.indexOf(prefix) === 0) {
                barcode = barcode.substring(prefix.length);
                console.log("--> [SalesHub_Debug] Prefijo removido. Código resultante:", barcode);
            }

            // Validar que tengamos un código numérico para consultar
            if (barcode.length > 0 && !isNaN(barcode)) {
                var request = {
                    program: "MMS200MI",
                    transaction: "GetItmByAlias",
                    record: {
                        ALAN: barcode,
                        ALTY: "EA13" // Configurado según tu pantalla MMS025
                    }
                };

                console.log("--> [SalesHub_Debug] Ejecutando consulta MI en M3...");

                SalesHubRestService.executeMI(request)
                    .then(function (response) {
                        console.log("--> [SalesHub_Debug] Respuesta de M3 recibida:", JSON.stringify(response));
                        
                        // Validar las estructuras habituales de respuesta en Sales Hub (items, records o directo)
                        var data = response;
                        if (response && response.records && response.records.length > 0) {
                            data = response.records[0];
                        } else if (response && response.items && response.items.length > 0) {
                            data = response.items[0];
                        } else if (response && response.item) {
                            data = response.item;
                        } else if (response && response.record) {
                            data = response.record;
                        }

                        if (data && data.ITNO) {
                            var targetItem = data.ITNO.trim();
                            console.log("--> [SalesHub_Debug] Artículo resuelto con éxito:", targetItem);
                            resolve({
                                itemNumber: targetItem,
                                quantity: 1
                            });
                        } else {
                            console.warn("--> [SalesHub_Debug] No se encontró ITNO en la respuesta de M3. Usando input original.");
                            resolve({
                                itemNumber: input,
                                quantity: 1
                            });
                        }
                    })
                    .catch(function (error) {
                        console.error("--> [SalesHub_Debug] Error en executeMI:", error);
                        resolve({
                            itemNumber: input,
                            quantity: 1
                        });
                    });
            } else {
                console.log("--> [SalesHub_Debug] Código no cumple condiciones. Procesando de forma nativa.");
                resolve({
                    itemNumber: input,
                    quantity: 1
                });
            }
        });
    }
};

// Retornar explícitamente el objeto si el cargador usa evaluación de contexto
QuickEntryConversionScript;
