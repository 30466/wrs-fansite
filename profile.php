<?php
error_reporting(E_ALL & ~E_DEPRECATED);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$memberIdOrName = isset($_GET['member_id']) ? $_GET['member_id'] : '谭思慧';
$type = isset($_GET['type']) ? $_GET['type'] : 'member';

$allowedTypes = ['member', 'election-ranks'];
if (!in_array($type, $allowedTypes)) {
    $type = 'member';
}

// 如果是数字ID，直接使用
if (is_numeric($memberIdOrName)) {
    $memberId = $memberIdOrName;
} else {
    // 如果是名字，先获取映射表找到ID
    $memberId = getMemberIdByName($memberIdOrName);
    if (!$memberId) {
        echo json_encode([
            'error' => '未找到该成员',
            'message' => '成员名称 "' . $memberIdOrName . '" 不存在'
        ]);
        exit;
    }
}

if ($type === 'election-ranks') {
    $apiUrl = "https://abm48.com/api/public/snh48/members/{$memberId}/election-ranks";
} else {
    $apiUrl = "https://abm48.com/api/public/snh48/members/{$memberId}";
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo json_encode([
        'error' => '请求失败',
        'message' => $error
    ]);
    exit;
}

if ($httpCode !== 200) {
    echo json_encode([
        'error' => 'API返回错误',
        'http_code' => $httpCode,
        'response' => $response
    ]);
    exit;
}

echo $response;

// 通过名字获取成员ID
function getMemberIdByName($name) {
    $mappingUrl = "https://abm48.com/api/public/snh48/mapping";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $mappingUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return null;
    }
    
    $mapping = json_decode($response, true);
    if (!$mapping || !is_array($mapping)) {
        return null;
    }
    
    // 查找名字对应的ID
    foreach ($mapping as $memberName => $id) {
        if ($memberName === $name) {
            return $id;
        }
    }
    
    return null;
}
?>
