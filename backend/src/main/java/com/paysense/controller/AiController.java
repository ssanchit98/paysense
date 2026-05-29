package com.paysense.controller;

import com.paysense.dto.AiQueryRequest;
import com.paysense.dto.AiQueryResponse;
import com.paysense.service.ClaudeService;
import com.paysense.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final ClaudeService claudeService;
    private final TransactionService transactionService;

    @PostMapping("/query")
    public ResponseEntity<AiQueryResponse> query(@Valid @RequestBody AiQueryRequest request) {
        String answer = claudeService.query(
                request.getQuestion(),
                transactionService.getAllTransactions(),
                transactionService.getAnalytics()
        );
        return ResponseEntity.ok(AiQueryResponse.builder()
                .question(request.getQuestion())
                .answer(answer)
                .build());
    }
}
