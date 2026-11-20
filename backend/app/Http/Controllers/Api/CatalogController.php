<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    public function consultations(): JsonResponse
    {
        $rows = DB::table('setup_consultation_services as s')
            ->leftJoin('setup_consultation_prices as p', 'p.consultation_id', '=', 's.id')
            ->leftJoin('setup_patient_subcategories as sc', 'sc.id', '=', 'p.sub_category_id')
            ->select('s.id', 's.code', 's.name', 's.department', 's.description', 's.duration_minutes', 's.cash_price', 's.status',
                'p.id as price_id', 'p.sub_category_id', 'sc.sub_category_code', 'sc.name as sub_category_name', 'sc.category_code',
                'sc.category_name', 'sc.scheme_code', 'sc.scheme_name', 'sc.status as sub_category_status', 'p.price')
            ->orderBy('s.name')->orderBy('sc.category_name')->orderBy('sc.name')
            ->get();

        $catalog = [];
        foreach ($rows as $row) {
            $id = (string) $row->id;
            $catalog[$id] ??= [
                'id' => (int) $row->id, 'code' => $row->code, 'name' => $row->name, 'department' => $row->department,
                'description' => $row->description, 'durationMinutes' => (int) ($row->duration_minutes ?? 0),
                'cashPrice' => (float) ($row->cash_price ?? 0), 'status' => $row->status ?: 'Active',
                'subCategoryPrices' => [], 'subCategoryPriceRows' => [],
            ];
            if ($row->sub_category_id === null) {
                continue;
            }
            $code = trim((string) $row->sub_category_code);
            if ($code !== '') {
                $catalog[$id]['subCategoryPrices'][$code] = (float) $row->price;
            }
            $catalog[$id]['subCategoryPriceRows'][] = [
                'priceId' => (int) $row->price_id, 'subCategoryId' => (int) $row->sub_category_id, 'subCategoryCode' => $row->sub_category_code,
                'subCategoryName' => $row->sub_category_name, 'categoryCode' => $row->category_code, 'categoryName' => $row->category_name,
                'schemeCode' => $row->scheme_code, 'schemeName' => $row->scheme_name, 'price' => (float) $row->price,
                'status' => $row->sub_category_status ?: 'Active',
            ];
        }

        $active = array_values(array_filter($catalog, fn ($service) => strtolower((string) $service['status']) !== 'inactive'));

        return response()->json(['success' => true, 'data' => $active]);
    }

    public function branches(): JsonResponse
    {
        $branches = DB::table('hospital_branches')->orderByDesc('is_default')->orderBy('name')->get();
        $current = $branches->firstWhere('is_default', 1)?->id ?? $branches->first()?->id ?? 1;

        return response()->json(['success' => true, 'currentBranchId' => (int) $current, 'data' => $branches]);
    }
}
