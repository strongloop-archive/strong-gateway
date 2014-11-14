function ApplicationsController($scope, $http) {

  $scope.load = function () {
    $http.get('/_internal/applications').success(function (data) {
      console.log(data);
      $scope.apps = data;
      $scope.orderProp = 'id';
    });
  };

  $scope.create = function () {
    $http.post('/_internal/applications',
      {
        name: $scope.name,
        description: $scope.description,
        pushSettings: {
          apns: {
            certData: $scope.certData,
            keyData: $scope.keyData
          },
          gcm: {
            serverApiKey: $scope.gcmKey
          }
        }
      })
      .success(function (data, status, headers) {
        // console.log(data, status);
        $scope.id = 'Application Id: ' + data.id;
        $scope.restApiKey = 'Application Key: ' + data.restApiKey;
      });
  };

  $scope.delete = function (index, id) {
    $http.delete('/_internal/applications/' + encodeURIComponent(id)).success(function (data, status, headers) {
      $scope.apps.splice(index, 1);
      $scope.status = 'Application deleted: ' + id + ' status: ' + status;
    });
  };
}