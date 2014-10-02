<?php
    header("Access-Control-Allow-Origin: *"); // Only reuired if accessing from different server.
    $q = $_SERVER["QUERY_STRING"];
    $response = file_get_contents("http://54.69.113.40:4243".$q);
    echo $response;
?>
