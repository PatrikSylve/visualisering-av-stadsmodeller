<?php

    $response =  $_POST["state"];
    $name =  $_POST["name"] . '.json';

    $fp = fopen($name, 'w');
    fwrite($fp, json_encode(json_decode($response)));
    fclose($fp);

    $command = escapeshellcmd('python cityjson-versioning-prototype-master/cjv.py commit' . $name;
    $output = shell_exec($command);
    echo $output;

?>
