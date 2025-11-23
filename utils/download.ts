export const downloadAsCSV = (headers: string[], data: (string | number)[][], filename: string) => {
    const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const printToPDF = (title: string, headers: string[], data: (string | number)[][]) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write('<html><head><title>' + title + '</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;} h1{text-align:center;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>' + title + '</h1>');
        printWindow.document.write('<table><thead><tr>');
        headers.forEach(header => {
            printWindow.document.write('<th>' + header + '</th>');
        });
        printWindow.document.write('</tr></thead><tbody>');
        data.forEach(row => {
            printWindow.document.write('<tr>');
            row.forEach(cell => {
                printWindow.document.write('<td>' + cell + '</td>');
            });
            printWindow.document.write('</tr>');
        });
        printWindow.document.write('</tbody></table>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
};

export const printHtmlAsPDF = (htmlContent: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.title = title; // Important for the download filename
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus(); // Required for some browsers
            printWindow.print();
            // printWindow.close(); // Can be uncommented to auto-close the tab
        }, 500);
    }
};
