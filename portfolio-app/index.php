<?php
require '../db.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Template Dashboard</title>
    <style>
        body { font-family: Arial; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Template Dashboard</h1>
    <table>
        <tr><th>ID</th><th>Name</th><th>Category</th><th>Folder</th><th>Status</th><th>Actions</th></tr>
        <?php
        $stmt = $pdo->query("SELECT * FROM templates ORDER BY category, name");
        while ($row = $stmt->fetch()) {
            echo "<tr>
                    <td>{$row['id']}</td>
                    <td>{$row['name']}</td>
                    <td>{$row['category']}</td>
                    <td>{$row['folder_name']}</td>
                    <td>{$row['status']}</td>
                    <td>
                        <button onclick='markAvailable({$row['id']})'>Mark Available</button>
                        <button onclick='markTaken({$row['id']})'>Mark Taken</button>
                    </td>
                  </tr>";
        }
        ?>
    </table>

    <script>
    function markAvailable(id) {
    fetch(`/api/update_status.php?id=${id}&status=available`).then(res => res.json()).then(() => location.reload());
}
function markTaken(id) {
    fetch(`/api/update_status.php?id=${id}&status=taken`).then(res => res.json()).then(() => location.reload());
}

    </script>
</body>
</html>
