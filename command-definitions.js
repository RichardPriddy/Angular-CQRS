(function() {
    'use strict';

    var serviceId = 'commands';
    angular.module('app')
        .factory(serviceId, ['CQRS', commands]);

    function commands(CQRS) {
        var service = {
            LoginCommand: LoginCommand
    }

    return service;

    function Command(name, values) {
        var key, value;
        this.name = name;
        if (values == null) values = {};
        this._definedProperties = {};
        for (key in values) {
            value = values[key];
            this._definedProperties[key] = value;
            this[key] = this._definedProperties[key];
        }
        this.properties = function () {
            return this._definedProperties;
        };
    }       
    
    function LoginCommand(model) {
      return new Command("Account/Commands/LoginCommand",
        {
          username: model.username,
          password: model.password,
          rememberMe: model.rememberMe
        });
      };
    }
}());
