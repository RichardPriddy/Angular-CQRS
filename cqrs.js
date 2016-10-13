(function() {
    'use strict';

    var serviceId = 'CQRS';
    angular.module('app')
        .factory(serviceId, ['$rootScope', '$location', 'common', CQRS]);

    function CQRS($rootScope, $location, common) {
        var $q = common.$q;

        var service = {
            sendCommand: sendCommand,
            query: query
        };

        var config = {
            appRoot: '/',
            query: {
                url: "api/Query/$queryName?values=$queryValues"
            },
            command: {
                url: "api/Command/$commandName",
                batchUrl: "command/Batch",
                optionsParameterName: 'values'
            }
        }

        return service;

        function sendCommand(commandName, commandValues) {
            if (commandValues == null) commandValues = {};
            common.logger.logSuccess("commandCreated:" + commandName, commandValues, serviceId);

            var deferred = $q.defer();

            var ajaxPromise = jQuery.ajax({
                url: config.appRoot + config.command.url.replace("$commandName", commandName),
                type: "POST",
                data: angular.toJson(commandValues),
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            });

            var doResolve = function (result, hasFailed) {
                var messageArgs;
                messageArgs = {
                    command: commandName,
                    values: commandValues,
                    result: result,
                    hasFailed: hasFailed || result.status === 403,
                    forbidden: result.status === 403
                };
                common.logger.logSuccess("commandResultReceived:" + commandName, messageArgs, serviceId);
                if (messageArgs.hasFailed === false) {
                    common.logger.logSuccess("commandExecuted:" + commandName, messageArgs, serviceId);
                    return deferred.resolve(result);
                } else if (messageArgs.forbidden) {
                    $rootScope.$emit('authorisationException', { name: commandName, messageArgs: messageArgs, serviceId: serviceId });
                    return deferred.reject(angular.fromJson(result.responseText));
                } else {
                    common.logger.logError("commandFailed:" + commandName, messageArgs, serviceId);
                    return deferred.reject(angular.fromJson(result.responseText));
                }
            };
            ajaxPromise.done(function (result) {
                return doResolve(result, false);
            });
            ajaxPromise.fail(function (result) {
                return doResolve(result, true);
            });

            return deferred.promise;
        }

        function query(queryName, options, ajaxOptions) {
            if (options == null) options = {};
            if (ajaxOptions == null) ajaxOptions = {};

            common.logger.logSuccess("queryExecuting:" + queryName, {
                name: queryName,
                values: options
            }, serviceId);

            var deferred = $q.defer();

            var request = _.extend({}, ajaxOptions, {
                url: config.appRoot + config.query.url.replace("$queryValues", encodeURIComponent(angular.toJson(options))).replace("$queryName", queryName),
                type: "GET",
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            });

            var ajaxPromise = jQuery.ajax(request);

            var doResolve = function (result, hasFailed) {
                var messageArgs;
                messageArgs = {
                    name: queryName,
                    values: options,
                    result: result || {},
                    hasFailed: hasFailed || result.status === 403,
                    forbidden: result.status === 403
                };
                common.logger.logSuccess("queryResultReceived:" + queryName, messageArgs, serviceId);
                if (messageArgs.hasFailed === false) {
                    common.logger.logSuccess("queryExecuted:" + queryName, messageArgs, serviceId);
                    return deferred.resolve(result);
                } else if (messageArgs.forbidden) {
                    $rootScope.$emit('authorisationException', { name: queryName, messageArgs: messageArgs, serviceId: serviceId });
                    return deferred.reject(angular.fromJson(result.responseText));
                } else {
                    common.logger.logError("queryFailed:" + queryName, messageArgs, serviceId);
                    return deferred.reject(angular.fromJson(result.responseText));
                }
            };
            ajaxPromise.done(function (result) {
                return doResolve(result, false);
            });
            ajaxPromise.fail(function (result) {
                return doResolve(result, true);
            });
            return deferred.promise;
        }
    }
})();
