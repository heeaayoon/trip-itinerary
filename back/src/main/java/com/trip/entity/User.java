package com.trip.entity;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor // 파라미터가 없는 기본 생성자를 생성
@AllArgsConstructor // 모든 필드를 파라미터로 받는 생성자를 생성
@Entity // 이 클래스가 데이터베이스 테이블과 매핑되는 JPA Entity임을 선언
@Table(name = "users") // 실제 데이터베이스의 "users" 테이블과 연결
public class User {

    @Id // 이 필드가 테이블의 Primary Key(기본 키)임을 명시
    @GeneratedValue
    @Column(name = "id", columnDefinition = "BINARY(16)") // MySQL에서 UUID를 효율적으로 저장하기 위한 설정
    private UUID id;

    @Column(unique = true, nullable = false) // email 컬럼은 유일해야 하고, 비어있으면 안 됨
    private String email;

    private String name;

    @Column(name = "avatar_url") // 자바 필드 이름과 DB 컬럼 이름이 다를 경우 명시
    private String avatarUrl;

    private String role;

    @Column(name = "created_at")
    private java.sql.Timestamp createdAt; // 날짜/시간 타입 매핑
    
    private String password;
    
    // User(1)가 Trip(N)을 생성 (1:N)
    @OneToMany(mappedBy = "creator")
    private List<Trip> createdTrips = new ArrayList<>();

    // User(1)가 TripParticipant(N)에 참여 (1:N)
    @OneToMany(mappedBy = "user")
    private List<TripParticipant> participants = new ArrayList<>();

}