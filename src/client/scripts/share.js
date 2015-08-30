;(function(){
  'use strict';

  angular.module('Pasty').factory('share', [ '$http', '$q', '$location', function($http, $q, $location){
    
    var location = $location.protocol() + '://' + $location.host() + ':' + $location.port();

    return {

      findPasty: function(id) {
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

      newPasty: function(name) {

        var url = '/new'; 

        if(name){
          url = '/new/' + name;
        }

        return $http.post(url).then(function(s){ return s.data.id; });

      },


      connectPasty: function(id) {
        var d = $q.defer();
        d.resolve(io(location + '/' + id));
        return d.promise;
      },

      disconnectPasty: function(socket) {
        var d = $q.defer();
        d.resolve(socket.disconnect());
        return d.promise;
      }

    };

  }]);

})();

