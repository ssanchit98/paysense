package com.paysense.service;

import com.paysense.dto.AnalyticsResponse;
import com.paysense.dto.CreateTransactionRequest;
import com.paysense.dto.TransactionResponse;
import com.paysense.model.Transaction;
import com.paysense.model.TransactionStatus;
import com.paysense.model.TransactionType;
import com.paysense.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository repository;

    @Transactional
    public TransactionResponse createTransaction(CreateTransactionRequest request) {
        // Idempotency check
        if (request.getIdempotencyKey() != null) {
            var existing = repository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return toResponse(existing.get());
            }
        }

        Transaction transaction = Transaction.builder()
                .sender(request.getSender())
                .recipient(request.getRecipient())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .type(request.getType())
                .description(request.getDescription())
                .status(TransactionStatus.PENDING)
                .idempotencyKey(request.getIdempotencyKey() != null
                        ? request.getIdempotencyKey()
                        : UUID.randomUUID().toString())
                .build();

        Transaction saved = repository.save(transaction);

        // Simulate async settlement for non-refund types
        if (request.getType() != TransactionType.REFUND) {
            simulateSettlement(saved);
        } else {
            saved.setStatus(TransactionStatus.REFUNDED);
            repository.save(saved);
        }

        return toResponse(saved);
    }

    private void simulateSettlement(Transaction t) {
        // Simulate ~10% failure rate, rest settle immediately
        double roll = Math.random();
        if (roll < 0.10) {
            t.setStatus(TransactionStatus.FAILED);
        } else {
            t.setStatus(TransactionStatus.SETTLED);
            t.setSettledAt(Instant.now());
        }
        repository.save(t);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {
        long total = repository.count();
        BigDecimal settledVolume = repository.sumSettledAmount();
        if (settledVolume == null) settledVolume = BigDecimal.ZERO;

        Map<String, AnalyticsResponse.TypeSummary> byType = new HashMap<>();
        for (Object[] row : repository.aggregateByType()) {
            TransactionType type = (TransactionType) row[0];
            long count = (long) row[1];
            BigDecimal volume = (BigDecimal) row[2];
            byType.put(type.name(), AnalyticsResponse.TypeSummary.builder()
                    .count(count)
                    .volume(volume)
                    .build());
        }

        return AnalyticsResponse.builder()
                .totalTransactions(total)
                .totalSettledVolume(settledVolume)
                .pendingCount(repository.countByStatus(TransactionStatus.PENDING))
                .failedCount(repository.countByStatus(TransactionStatus.FAILED))
                .refundedCount(repository.countByStatus(TransactionStatus.REFUNDED))
                .settledCount(repository.countByStatus(TransactionStatus.SETTLED))
                .byType(byType)
                .build();
    }

    @Transactional
    public void seedDemoData() {
        if (repository.count() > 0) return;

        String[] users = {"alice@example.com", "bob@example.com", "carol@example.com",
                "dave@example.com", "eve@example.com"};
        String[] descriptions = {"Coffee subscription", "Monthly SaaS fee", "Freelance payment",
                "Refund for order #4821", "Platform fee", "Group dinner split",
                "Vendor payout", "API usage billing"};
        TransactionType[] types = TransactionType.values();
        String[] currencies = {"USD", "USD", "USD", "EUR", "GBP"};

        for (int i = 0; i < 40; i++) {
            String sender = users[i % users.length];
            String recipient = users[(i + 1) % users.length];
            BigDecimal amount = BigDecimal.valueOf(10 + (Math.random() * 490));
            amount = amount.setScale(2, java.math.RoundingMode.HALF_UP);

            CreateTransactionRequest req = new CreateTransactionRequest();
            req.setSender(sender);
            req.setRecipient(recipient);
            req.setAmount(amount);
            req.setCurrency(currencies[i % currencies.length]);
            req.setType(types[i % types.length]);
            req.setDescription(descriptions[i % descriptions.length]);
            createTransaction(req);
        }
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .idempotencyKey(t.getIdempotencyKey())
                .sender(t.getSender())
                .recipient(t.getRecipient())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .status(t.getStatus())
                .type(t.getType())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .settledAt(t.getSettledAt())
                .build();
    }
}
