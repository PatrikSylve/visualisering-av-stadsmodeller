
<?php

    $version_name = 'versions/' . $_POST["name"] . '_versions.json';
    $checkout_name = 'versions/checkout/' . $_POST["name"] . '.json';
    $response =  $_POST["state"];
    $fp = fopen($version_name, 'w');
    fwrite($fp, json_encode(json_decode($response)));
    fclose($fp);

    $command = escapeshellcmd('python cityjson-versioning-prototype-master/cjv.py ' . $version_name .' checkout master ' . $checkout_name);
    $output = shell_exec($command);

    
    echo $checkout_name;

?>