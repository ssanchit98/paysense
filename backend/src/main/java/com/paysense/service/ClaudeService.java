package com.paysense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.paysense.dto.AnalyticsResponse;
import com.paysense.dto.TransactionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaudeService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String query(String question, List<TransactionResponse> transactions, AnalyticsResponse analytics) {
        if (apiKey == null || apiKey.isBlank()) {
            return buildFallbackResponse(question, analytics);
        }

        try {
            String systemPrompt = buildSystemPrompt(transactions, analytics);
            String body = buildRequestBody(systemPrompt, question);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                return root.path("content").get(0).path("text").asText();
            } else {
                log.warn("Claude API returned status {}: {}", response.statusCode(), response.body());
                return buildFallbackResponse(question, analytics);
            }
        } catch (Exception e) {
            log.error("Error calling Claude API", e);
            return buildFallbackResponse(question, analytics);
        }
    }

    private String buildSystemPrompt(List<TransactionResponse> transactions, AnalyticsResponse analytics) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are PaySense AI, an intelligent payment analytics assistant. ");
        sb.append("You analyze payment transaction data and answer questions concisely and accurately.\n\n");
        sb.append("Current analytics summary:\n");
        sb.append("- Total transactions: ").append(analytics.getTotalTransactions()).append("\n");
        sb.append("- Total settled volume: $").append(analytics.getTotalSettledVolume()).append("\n");
        sb.append("- Settled: ").append(analytics.getSettledCount()).append("\n");
        sb.append("- Pending: ").append(analytics.getPendingCount()).append("\n");
        sb.append("- Failed: ").append(analytics.getFailedCount()).append("\n");
        sb.append("- Refunded: ").append(analytics.getRefundedCount()).append("\n\n");

        if (analytics.getByType() != null) {
            sb.append("Volume by type:\n");
            analytics.getByType().forEach((type, summary) ->
                    sb.append("  ").append(type).append(": ").append(summary.getCount())
                            .append(" txns, $").append(summary.getVolume()).append("\n"));
        }

        sb.append("\nRecent transactions (up to 20):\n");
        transactions.stream().limit(20).forEach(t ->
                sb.append(String.format("  [%s] %s -> %s: $%.2f %s (%s) - %s\n",
                        t.getStatus(), t.getSender(), t.getRecipient(),
                        t.getAmount(), t.getCurrency(), t.getType(),
                        t.getDescription() != null ? t.getDescription() : "no description")));

        sb.append("\nAnswer the user's question in 2-4 sentences. Be direct and data-driven.");
        return sb.toString();
    }

    private String buildRequestBody(String systemPrompt, String question) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", "claude-sonnet-4-20250514");
        root.put("max_tokens", 512);
        root.put("system", systemPrompt);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", question);
        messages.add(userMsg);
        root.set("messages", messages);

        return objectMapper.writeValueAsString(root);
    }

    private String buildFallbackResponse(String question, AnalyticsResponse analytics) {
        return String.format(
                "Based on your ledger: %d total transactions with $%.2f in settled volume. " +
                "Breakdown: %d settled, %d failed, %d refunded. " +
                "(AI analysis unavailable — configure ANTHROPIC_API_KEY for natural language insights.)",
                analytics.getTotalTransactions(),
                analytics.getTotalSettledVolume(),
                analytics.getSettledCount(),
                analytics.getFailedCount(),
                analytics.getRefundedCount()
        );
    }
}
