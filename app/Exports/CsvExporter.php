<?php

declare(strict_types=1);

namespace App\Exports;

use App\Contracts\Exports\ExporterInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CSV Exporter implementation.
 */
class CsvExporter implements ExporterInterface
{
    /**
     * Stream CSV data to the browser.
     *
     * @param  iterable<array<string, mixed>>  $rows
     * @param  array<string>  $columns
     */
    public function stream(iterable $rows, array $columns): StreamedResponse
    {
        $filename = 'export_'.date('Y-m-d_His').'.csv';
        $response = new StreamedResponse(function () use ($rows, $columns) {
            $handle = fopen('php://output', 'w');

            // Write header row with column names (not keys)
            fputcsv($handle, array_values($columns));

            // Write data rows
            foreach ($rows as $row) {
                $csvRow = [];
                foreach (array_keys($columns) as $key) {
                    $value = $row[$key] ?? '';
                    // Format boolean values for better readability
                    if (is_bool($value)) {
                        $value = $value ? 'Activo' : 'Inactivo';
                    }
                    $csvRow[] = $value;
                }
                fputcsv($handle, $csvRow);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="export.csv"');

        return $response;
    }
}
