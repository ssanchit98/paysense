package com.paysense.repository;

import com.paysense.model.Transaction;
import com.paysense.model.TransactionStatus;
import com.paysense.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    List<Transaction> findByStatusOrderByCreatedAtDesc(TransactionStatus status);

    List<Transaction> findAllByOrderByCreatedAtDesc();

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.status = 'SETTLED'")
    BigDecimal sumSettledAmount();

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = ?1")
    long countByStatus(TransactionStatus status);

    @Query("SELECT t FROM Transaction t WHERE t.createdAt >= ?1 ORDER BY t.createdAt DESC")
    List<Transaction> findRecentTransactions(Instant since);

    @Query("SELECT t.type, COUNT(t), SUM(t.amount) FROM Transaction t GROUP BY t.type")
    List<Object[]> aggregateByType();

    List<Transaction> findBySenderOrRecipient(String sender, String recipient);
}
