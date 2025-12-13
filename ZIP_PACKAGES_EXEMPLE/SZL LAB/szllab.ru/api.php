<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';  // или IP где PostgreSQL
$db = 'scripts_database';
$user = 'твой_пользователь';
$pass = 'твой_пароль';
$port = '5432';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
    
    // Получаем все активные компоненты
    $stmt = $pdo->query("
        SELECT 
            c.name, 
            c.type, 
            c.config 
        FROM components c 
        WHERE c.is_active = true 
        ORDER BY c.type, c.name
    ");
    
    $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'data' => $components,
        'message' => 'Компоненты загружены успешно!'
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
?>