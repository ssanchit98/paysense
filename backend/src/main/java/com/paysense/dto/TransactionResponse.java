package com.paysense.dto;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransactionResponse {
    private UUID id;
    private String idempotencyKey;
    private String sender;
    private String recipient;
    private BigDecimal amount;
    private String currency;
    private TransactionStatus status;
    private TransactionType type;
    private String description;
    private Instant createdAt;
    private Instant settledAt;

}