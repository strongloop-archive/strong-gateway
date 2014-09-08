function UsersController($scope, $http) {

  $scope.load = function () {
    $http.get('/api/users').success(function (data) {
      console.log(data);
      $scope.users = data;
      $scope.orderProp = 'id';
    });
  };

  $scope.create = function () {
    $http.post('/api/users',
      {
        username: $scope.name,
        email: $scope.email,
        password: $scope.password
      })
      .success(function (data, status, headers) {
        // console.log(data, status);
        $scope.id = 'User Id: ' + data.id;
      });
  };

  $scope.delete = function (index, id) {
    $http.delete('/api/users/' + encodeURIComponent(id)).success(function (data, status, headers) {
      $scope.users.splice(index, 1);
      $scope.status = 'User deleted: ' + id + ' status: ' + status;
    });
  };
}