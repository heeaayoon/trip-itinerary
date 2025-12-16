package com.trip.util;

import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Convert;

@Convert
public class JsonListConverter implements AttributeConverter<List<String>, String> {

	private final ObjectMapper mapper = new ObjectMapper();
	
	// 자바 List -> DB JSON 문자열 (저장할 때)
    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null) return null;
        try {
            return mapper.writeValueAsString(attribute); // ["A", "B"] 형태로 변환
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 글쓰기 실패", e);
        }
    }

    // DB JSON 문자열 -> 자바 List (꺼내올 때)
    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return null;
        try {
            return mapper.readValue(dbData, new TypeReference<List<String>>() {});
        } catch (IOException e) {
            throw new RuntimeException("JSON 읽기 실패", e);
        }
    }
}