export function errorHtml(errorLogs: any[]) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Logs Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.20.15/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState } = React;

        const errorLogs = ${JSON.stringify(errorLogs)};

        const ErrorCard = ({ log }) => {
            const [isExpanded, setIsExpanded] = useState(false);

            return (
                <div className="bg-white shadow-md rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-red-600">{log.request.url}</h3>
                            <p className="text-sm text-gray-600">{log.timestamp}</p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}  
                            className="text-blue-500 hover:text-blue-700"
                        >
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                        </button>
                    </div>
                    {isExpanded && (
                        <div className="mt-4">
                            <h4 className="text-md font-medium">Stack Trace:</h4>
                            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{log.stack}</pre>
                            <h4 className="text-md font-medium mt-2">Request Details:</h4>
                            <p><strong>Method:</strong> {log.request.method}</p>
                            <p><strong>URL:</strong> {log.request.url}</p>
                            <p><strong>Query:</strong> {JSON.stringify(log.request.query, null, 2)}</p>
                            <p><strong>Param:</strong> {JSON.stringify(log.request.params, null, 2)}</p>
                            <p><strong>Body:</strong> {JSON.stringify(log.request.body, null, 2)}</p>
                        </div>
                    )}
                </div>
            );
        };

        const Pagination = ({ currentPage, totalPages, onPageChange }) => {
            return (
                <div className="flex justify-center space-x-2 mt-4">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    >
                        Next
                    </button>
                </div>
            );
        };

        const ErrorDashboard = () => {
            const [currentPage, setCurrentPage] = useState(1);
            const itemsPerPage = 3;
            const totalPages = Math.ceil(errorLogs.length / itemsPerPage);

            const paginatedLogs = errorLogs.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
            );

            const handlePageChange = (page) => {
                if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                }
            };

            return (
                <div className="min-h-screen bg-gray-100 p-6">
                    <h1 className="text-3xl font-bold text-center mb-6">Error Logs Dashboard</h1>
                    <div className="max-w-4xl mx-auto">
                        {paginatedLogs.map((log, index) => (
                            <ErrorCard key={index} log={log} />
                        ))}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            );
        };

        ReactDOM.render(<ErrorDashboard />, document.getElementById('root'));
    </script>
</body>
</html>
`;
}
