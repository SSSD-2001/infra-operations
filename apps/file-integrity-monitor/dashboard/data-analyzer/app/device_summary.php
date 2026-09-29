<?php
/**  Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).

 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. 
 */


session_start();
if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    header("Location: login.php");
    exit;
}

include 'db_connect.php';

$table = 'centralised_fim_db';

// Read filters from POST
$startDate = $_POST['startDate'] ?? date("Y-m-d", strtotime("-2 days"));
$endDate   = $_POST['endDate'] ?? date("Y-m-d");
$machineFilter = $_POST['machineFilter'] ?? "";
$conclusionFilter = $_POST['conclusionFilter'] ?? "";

// Build SQL query (distinct machine identifiers only)
$sql = "SELECT DISTINCT machine_identifier
        FROM `$table`
        WHERE timestamp BETWEEN ? AND ?";

$params = [$startDate . " 00:00:00", $endDate . " 23:59:59"];
$types  = "ss";

if (!empty($machineFilter)) {
    $sql .= " AND machine_identifier LIKE ?";
    $params[] = "%" . $machineFilter . "%";
    $types .= "s";
}

if (!empty($conclusionFilter)) {
    $sql .= " AND conclusion LIKE ?";
    $params[] = "%" . $conclusionFilter . "%";
    $types .= "s";
}

$sql .= " ORDER BY machine_identifier ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$hosts = [];
while ($row = $result->fetch_assoc()) {
    $hosts[] = $row['machine_identifier'];
}

$totalHosts = count($hosts);

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Machine Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { margin-bottom: 5px; }
        .meta { color: #555; font-size: 13px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .btn { padding: 6px 12px; background: #007BFF; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .topbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
    </style>
</head>
<body>

<div class="topbar">
    <div>
        <h2>Machine Identifier Summary</h2>
        <div class="meta">
            Date Range:
            <b><?= htmlspecialchars($startDate) ?></b>
            →
            <b><?= htmlspecialchars($endDate) ?></b>
            <br>
            Total Hosts: <b><?= $totalHosts ?></b>
        </div>
    </div>
    <button class="btn" onclick="window.close()">Close</button>
</div>

<?php if ($totalHosts > 0): ?>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Machine Identifier</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($hosts as $index => $host): ?>
                <tr>
                    <td><?= $index + 1 ?></td>
                    <td><?= htmlspecialchars($host) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php else: ?>
    <p style="color:red; font-weight:bold;">No hosts found for the selected filters.</p>
<?php endif; ?>

</body>
</html>
