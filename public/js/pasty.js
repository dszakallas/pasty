;(function(){
  'use strict';

  angular.module('Pasty').factory('pasty', [ '$http', '$q', '$location', function($http, $q, $location){
    
    var location = $location.protocol() + '://' + $location.host() + ':' + $location.port();

    return {

      connect: function(id) {
        
        console.log("Finding Pasty " + id + " ...");
        
        return this.find(id).then(function(found){
          return $q(function(resolve,reject){
            if(found) {
              console.log("Pasty " + id + " found. Connecting...");
              resolve(io(location + '/' + id));
            }
            else {
              console.log("Pasty " + id + " not found.");
              reject('not found');
            }
          });
        });
      },

      find: function(id) {
        var d = $q.defer();

        $http.head(location + '/' + id).then(
          function(s) { d.resolve(true) },
          function(e) { 
            if(e.status == 404) 
              d.resolve(false) 
            else
              d.reject(e)
          });

        return d.promise;
      },

      create: function(name) {

        var url = '/new'; 

        if(name){
          url = '/new/' + name;
        }

        return $http.post(url).then(function(s){ return s.data.id; });

      },

      disconnect: function(socket) {
        return $q.resolve(socket.disconnect());
      }

    };

  }]);

})();

