package com.paysense.controller;

import com.paysense.dto.AnalyticsResponse;
import com.paysense.dto.CreateTransactionRequest;
import com.paysense.dto.TransactionResponse;
import com.paysense.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody CreateTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.createTransaction(request));
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(transactionService.getAnalytics());
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedDemoData() {
        transactionService.seedDemoData();
        return ResponseEntity.ok("Demo data seeded successfully");
    }
}
