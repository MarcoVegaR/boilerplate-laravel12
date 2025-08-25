<?php

namespace App\Logging;

use Monolog\Logger;
use Monolog\LogRecord;

class RequestIdTap
{
    public function __invoke(Logger $logger): void
    {
        $logger->pushProcessor(function (LogRecord $record): LogRecord {
            try {
                /** @var \Illuminate\Http\Request $req */
                $req = request();
                $rid = $req->attributes->get('request_id');
                if ($rid === null) {
                    $rid = $req->headers->get('X-Request-Id');
                }
            } catch (\Throwable $e) {
                $rid = null;
            }

            return $record->with(
                extra: $record->extra + ['request_id' => $rid]
            );
        });
    }
}
