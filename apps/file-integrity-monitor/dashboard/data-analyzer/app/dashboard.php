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

// Default filter: last 2 days
$startDate = $_POST['startDate'] ?? date("Y-m-d", strtotime("-2 days"));
$endDate   = $_POST['endDate'] ?? date("Y-m-d");
$machineFilter = $_POST['machineFilter'] ?? "";
$conclusionFilter = $_POST['conclusionFilter'] ?? "";

// Build SQL

$page = max(1, (int)($_GET['page'] ?? 1));
$rowsPerPage = 100;
$offset = ($page - 1) * $rowsPerPage;

$sql = "SELECT id, machine_identifier, conclusion, timestamp, readable_text_cmd, data_changed
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

$sql .= " ORDER BY id DESC LIMIT ? OFFSET ?";
$params[] = $rowsPerPage;
$params[] = $offset;
$types .= "ii";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
    <title>WSO2 File Integrity Monitoring System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { margin-bottom: 0; }
        h2.subtitle { margin-top: 5px; color: #555; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
        .red-row { background-color: #fdd; }
        .filters input { margin-right: 8px; padding: 4px; }
        .btn { padding: 6px 12px; background: #007BFF; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .pagination { margin-top: 15px; }
        .no-results { display: none; font-weight: bold; margin-top: 10px; color: red; }
    </style>
</head>
<body>
<div class="container">
    <h1>WSO2 File Integrity Monitoring System</h1>
    <h2 class="subtitle">Powered by DigiOps</h2>

    <form method="POST" action="">
        <div class="filters">
            <input type="text" name="machineFilter" placeholder="Search Machine Identifier..." value="<?= htmlspecialchars($machineFilter) ?>" />
            <input type="text" name="conclusionFilter" placeholder="Search Conclusion..." value="<?= htmlspecialchars($conclusionFilter) ?>" />
            <input type="date" name="startDate" value="<?= htmlspecialchars($startDate) ?>" />
            <input type="date" name="endDate" value="<?= htmlspecialchars($endDate) ?>" />

            <button type="submit" class="btn">Apply Filter</button>

            <!-- Export CSV Button -->
            <button type="submit"
                    class="btn"
                    formaction="export_csv.php"
                    formtarget="_blank"
                    style="margin-left:6px;">
                Export CSV
            </button>
        </div>
    </form>


    <!-- Machine Identifier Summary Popup -->
    <form method="POST" action="device_summary.php" target="_blank" style="margin-top:10px;">
        <input type="hidden" name="machineFilter" value="<?= htmlspecialchars($machineFilter) ?>">
        <input type="hidden" name="conclusionFilter" value="<?= htmlspecialchars($conclusionFilter) ?>">
        <input type="hidden" name="startDate" value="<?= htmlspecialchars($startDate) ?>">
        <input type="hidden" name="endDate" value="<?= htmlspecialchars($endDate) ?>">
        <button type="submit" class="btn">Device Summary</button>
    </form>


    <!-- Data Table -->
    <?php if (!empty($data)): ?>
        <table id="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Machine Identifier</th>
                    <th>Conclusion</th>
                    <th>Timestamp</th>
                    <th>Execution Command</th>
                    <th>Data Diff</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($data as $row): ?>
                    <?php $rowClass = (strpos($row["data_changed"], "Permission has changed") !== false) ? "class='red-row'" : ""; ?>
                    <tr <?= $rowClass ?>>
                        <td><?= htmlspecialchars($row['id']) ?></td>
                        <td><?= htmlspecialchars($row['machine_identifier']) ?></td>
                        <td><?= htmlspecialchars($row['conclusion']) ?></td>
                        <td><?= htmlspecialchars($row['timestamp']) ?></td>
                        <td><?= htmlspecialchars($row['readable_text_cmd']) ?></td>
                        <td>
                            <?php
                                $short = htmlspecialchars(substr($row["data_changed"], 0, 100));
                                if (strlen($row["data_changed"]) > 100) {
                                    echo "<pre>$short...</pre>";
                                    echo "<a href='view_full_data.php?id={$row['id']}' target='_blank'>Click to view full message</a>";
                                } else {
                                    echo "<pre>" . htmlspecialchars($row["data_changed"]) . "</pre>";
                                }
                            ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php else: ?>
        <div class="no-results">No results found.</div>
    <?php endif; ?>

    <!-- Pagination -->
    <div class="pagination">
        <button id="prev-button" onclick="changePage(-1)">Previous</button>
        <button id="next-button" onclick="changePage(1)">Next</button>
    </div>
</div>

<script>
    let currentPage = 1;
    const rowsPerPage = 100;
    let allRows = [];

    function paginate() {
        allRows = Array.from(document.querySelectorAll("#data-table tbody tr"));
        updateTableDisplay();
    }

    function updateTableDisplay() {
        allRows.forEach(r => r.style.display = "none");
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        for (let i = start; i < end && i < allRows.length; i++) {
            allRows[i].style.display = "";
        }
        document.getElementById("prev-button").disabled = currentPage <= 1;
        document.getElementById("next-button").disabled = currentPage >= Math.ceil(allRows.length / rowsPerPage);
    }

    function changePage(direction) {
        event.preventDefault();
        currentPage += direction;
        updateTableDisplay();
    }



    window.onload = paginate;
</script>
</body>
</html>
