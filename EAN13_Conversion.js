/**
 * Script de conversión para Infor Sales Hub - Quick Entry
 * Traduce códigos EAN13 con prefijo a su número de artículo único (ITNO)
 */
(function () {
    return {
        /**
         * Función principal disparada por el punto de salida
         * @param {string} input - El código escaneado o ingresado (Ej: 7779123456789 o 779123456789)
         * @returns {Promise} Retorna objeto { itemNumber: string, quantity: number }
         */
        execute: function (input) {
            return new Promise(function (resolve, reject) {
                // 1. Limpiar espacios en blanco
                var barcode = input ? input.trim() : "";
                
                // Configuración del prefijo asignado en Sales Hub UI
                var prefix = "7"; 

                // 2. Validar y procesar el prefijo
                // Si el código escaneado empieza con el prefijo '7', se lo removemos para buscar el EAN real en M3
                if (barcode.indexOf(prefix) === 0) {
                    barcode = barcode.substring(prefix.length);
                }

                // 3. Regla de validación del código de barras resultante (numérico)
                if (barcode.length > 0 && !isNaN(barcode)) {
                    
                    // Ajuste técnico definitivo basado en tu pantalla MMS025
					var request = {
						program: "MMS200MI",
						transaction: "GetItmByAlias", 
						record: { 
							ALAN: barcode, // Tu código EAN (Ej: 7501476669010)
							ALTY: "EA13"   // Tipo de alias correcto según tu configuración de M3
						}
					};


                    // Ejecución del servicio MI a través de Sales Hub
                    SalesHubRestService.executeMI(request)
                        .then(function (response) {
                            // M3 usualmente devuelve la estructura en response.record o response.item según el wrapper de Sales Hub
                            var record = response.record || response.item;
                            
                            if (record && record.ITNO) {
                                // Devolvemos el número de artículo real de M3
                                resolve({
                                    itemNumber: record.ITNO.trim(),
                                    quantity: 1
                                });
                            } else {
                                // Si la API responde pero no encuentra el alias, procesa con el input original
                                resolve({
                                    itemNumber: input,
                                    quantity: 1
                                });
                            }
                        })
                        .catch(function (error) {
                            console.error("Error al consultar el Alias en M3:", error);
                            // En caso de caída de red o error de API, no bloquea al vendedor
                            resolve({
                                itemNumber: input,
                                quantity: 1
                            });
                        });
                } else {
                    // Si no cumple el formato esperado, se envía el input original sin alterar
                    resolve({
                        itemNumber: input,
                        quantity: 1
                    });
                }
            });
        }
    };
})();
