"""
Instruction building utilities for agent configuration.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


async def build_analysis_instructions(config: Dict[str, Any], classify_data_fields_func) -> str:
    """Build analysis instructions based on assistant configuration."""
    instructions = []
    
    # Add structured data collection instructions
    structured_data = config.get("structured_data_fields", [])
    # Handle case where structured_data_fields is None
    if structured_data is None:
        structured_data = []
    logger.info(f"ANALYSIS_INSTRUCTIONS_DEBUG | structured_data_count={len(structured_data)} | data={structured_data}")
    if structured_data:
        # Use LLM to classify fields
        try:
            classification = await classify_data_fields_func(structured_data)
        except Exception as e:
            logger.error(f"CLASSIFICATION_ERROR | error={str(e)}")
            # Fallback to basic classification
            classification = {
                "ask_user": [field.get("name", "") for field in structured_data],
                "extract_from_conversation": []
            }
        
        # Create field lookup
        field_map = {field.get("name", ""): field for field in structured_data}
        
        # Build instructions for fields to ask
        ask_fields = []
        for field_name in classification.get("ask_user", []):
            field = field_map.get(field_name)
            if field:
                ask_fields.append(f"- {field.get('name', '')}: {field.get('description', '')} (type: {field.get('type', 'string')})")
        
        if ask_fields:
            instructions.append("PRIORITY DATA COLLECTION:")
            instructions.append("You have access to collect_analysis_data(field_name, field_value, field_type) function.")
            instructions.append("IMPORTANT: After your first greeting, immediately start collecting the following data from the user:")
            instructions.extend(ask_fields)
            instructions.append("Ask for this information naturally and conversationally. Use collect_analysis_data silently whenever you have a value - this tool completes without requiring a response.")
            instructions.append("Collect ALL required data fields before moving to other topics like booking or general conversation.")
            instructions.append("Continue natural conversation flow - do NOT repeat yourself or say the same thing twice.")
        
        # Build instructions for fields to extract
        extract_fields = []
        for field_name in classification.get("extract_from_conversation", []):
            field = field_map.get(field_name)
            if field:
                extract_fields.append(f"- {field.get('name', '')}: {field.get('description', '')} (type: {field.get('type', 'string')})")
        
        if extract_fields:
            instructions.append("\nAI-EXTRACTED FIELDS:")
            instructions.append("The following fields will be automatically extracted from the conversation using AI analysis:")
            instructions.extend(extract_fields)
            instructions.append("DO NOT ask the user for these fields - they will be analyzed and extracted automatically from the conversation.")
    
    return "\n".join(instructions) if instructions else ""


def build_call_management_instructions(config: Dict[str, Any]) -> str:
    """Build call management instructions from configuration."""
    instructions = []
    
    # End call message
    end_call_message = config.get("end_call_message")
    if end_call_message:
        instructions.append(f"END_CALL_MESSAGE: When the call is ending, say exactly: '{end_call_message}'")
    
    # Idle messages
    idle_messages = config.get("idle_messages", [])
    max_idle_messages = config.get("max_idle_messages", 3)
    silence_timeout = config.get("silence_timeout", 20)  # Increased from 15 to 20 seconds
    
    if idle_messages and isinstance(idle_messages, list):
        instructions.append(f"IDLE_MESSAGE_HANDLING:")
        instructions.append(f"- If the user is silent for {silence_timeout} seconds, use one of these idle messages:")
        for i, message in enumerate(idle_messages, 1):
            instructions.append(f"  {i}. '{message}'")
        instructions.append(f"- Maximum idle messages to send: {max_idle_messages}")
        instructions.append(f"- After {max_idle_messages} idle messages, end the call politely")
    
    # Call duration limit
    max_call_duration = config.get("max_call_duration", 30)
    instructions.append(f"CALL_DURATION_LIMIT: This call will automatically end after {max_call_duration} minutes to prevent excessive charges")
    instructions.append(f"CALL_MONITORING: Be aware that the system will automatically terminate this call after {max_call_duration} minutes")
    
    # Call transfer (cold transfer only)
    transfer_enabled = config.get("transfer_enabled", False)
    if transfer_enabled:
        transfer_condition = config.get("transfer_condition", "")
        transfer_sentence = config.get("transfer_sentence", "")
        transfer_phone = config.get("transfer_phone_number", "")
        transfer_country_code = config.get("transfer_country_code", "+1")
        
        if transfer_condition and transfer_phone:
            full_phone = f"{transfer_country_code}{transfer_phone}" if not transfer_phone.startswith("+") else transfer_phone
            instructions.append(f"\nCALL_TRANSFER_CONFIGURATION:")
            instructions.append(f"- Transfer is ENABLED for this assistant")
            instructions.append(f"- Transfer condition: {transfer_condition}")
            instructions.append(f"- Transfer phone number: {full_phone}")
            if transfer_sentence:
                instructions.append(f"- Before transferring, say: '{transfer_sentence}'")
            instructions.append(f"\nTRANSFER_INSTRUCTIONS:")
            instructions.append(f"- Monitor the conversation for: {transfer_condition}")
            instructions.append(f"- When this condition is met, you should indicate that a transfer is needed")
            instructions.append(f"- This is a COLD TRANSFER (direct transfer without announcement to the receiving party)")
            instructions.append(f"- Use the transfer_required() function when the transfer condition is detected")
    
    return "\n".join(instructions) if instructions else ""


def build_workflow_instructions(config: Dict[str, Any]) -> str:
    """Build conversation flow instructions from visual nodes and edges."""
    nodes = config.get("nodes", [])
    edges = config.get("edges", [])
    
    if not nodes:
        return ""
    
    # Pre-process nodes into a more accessible format, handling React Flow 'data' nesting
    processed_nodes = []
    for node in nodes:
        # React Flow stores custom data in the 'data' field
        data = node.get("data", {})
        
        # Flatten node structure
        p_node = {
            "id": node.get("id"),
            "type": node.get("type", "task"),
            "title": data.get("title") or node.get("title") or node.get("id"),
            "input_prompt": data.get("input_prompt") or data.get("prompt") or node.get("input_prompt") or "",
            "first_dialogue": data.get("first_dialogue") or data.get("dialogue") or node.get("first_dialogue") or "",
            "transitions": []
        }
        
        # Determine if it's a start node by type or by having no incoming edges later
        # But we'll use the type 'start' or 'input' as a primary indicator
        if p_node["type"] in ["start", "input", "startNode"]:
            p_node["is_start"] = True
        else:
            p_node["is_start"] = False
            
        processed_nodes.append(p_node)

    # Build map for quick lookup
    node_map = {node["id"]: node for node in processed_nodes}

    # Process edges to build transitions
    for edge in edges:
        source_id = edge.get("source")
        target_id = edge.get("target")
        # Support various label formats from React Flow edges
        edge_data = edge.get("data", {})
        label = (
            edge.get("label") or 
            edge_data.get("description") or 
            edge_data.get("label") or 
            edge_data.get("condition_description") or
            "transition"
        )
        
        if source_id in node_map and target_id in node_map:
            node_map[source_id]["transitions"].append({
                "condition": label,
                "to": target_id,
                "target_title": node_map[target_id]["title"]
            })

    instructions = ["\nCONVERSATION WORKFLOW (STATE MACHINE):"]
    instructions.append("You MUST strictly follow this conversation flow. You are always in exactly ONE state at a time.")
    
    # Identify the actual start node
    start_node = next((n for n in processed_nodes if n.get("is_start")), None)
    if not start_node and processed_nodes:
        # Fallback to the first node if no start node identified
        start_node = processed_nodes[0]
        
    if start_node:
        instructions.append(f"\n1. START_STATE: You begin in state '[{start_node['id']}]' ({start_node['title']}).")
        if start_node['first_dialogue']:
             instructions.append(f"   - Opening Dialogue: \"{start_node['first_dialogue']}\"")
        if start_node['input_prompt']:
             instructions.append(f"   - Opening Instruction: {start_node['input_prompt']}")

    instructions.append("\n2. STATES DEFINITIONS:")
    for node in processed_nodes:
        node_id = node["id"]
        title = node["title"]
        prompt = node["input_prompt"]
        dialogue = node["first_dialogue"]
        node_type = node["type"].upper()
        
        instructions.append(f"\n[{node_id}] - {title}:")
        if prompt:
            instructions.append(f"   - CORE INSTRUCTION: {prompt}")
        if dialogue:
            instructions.append(f"   - ENTRY DIALOGUE (optional context): \"{dialogue}\"")
        
        # Transitions
        if node["transitions"]:
            instructions.append("   - TRANSITIONS (Conditions to move to other states):")
            for trans in node["transitions"]:
                instructions.append(f"     * IF {trans['condition']} -> TRANSITION TO '[{trans['to']}]' ({trans['target_title']})")
        elif node_type in ["END", "TERMINATE"]:
            instructions.append("   - ACTION: POLITELY END THE CALL")
        elif node_type == "TRANSFER":
            instructions.append("   - ACTION: INITIATE CALL TRANSFER")

    instructions.append("\n3. RULES FOR EXECUTION:")
    instructions.append("- Always keep track of your CURRENT STATE ID.")
    instructions.append("- Monitor the user's input for the TRANSITION CONDITIONS listed for your current state.")
    instructions.append("- When a transition condition is met, move to the target state and IMMEDIATELY adopt its 'CORE INSTRUCTION'.")
    instructions.append("- Do NOT jump between states unless an edge (transition) exists.")
    instructions.append("- Start by acting according to the START_STATE.")
    
    return "\n".join(instructions)


def build_agent_instructions(config: Dict[str, Any]) -> str:
    """Build comprehensive agent instructions from configuration."""
    instructions = []
    
    # Base instructions
    base_instructions = config.get("instructions", "")
    if base_instructions:
        instructions.append(base_instructions)
    
    # Add analysis instructions
    analysis_instructions = config.get("analysis_instructions", "")
    if analysis_instructions:
        instructions.append(f"\nANALYSIS REQUIREMENTS:\n{analysis_instructions}")
    
    # Add call management instructions
    call_mgmt_instructions = build_call_management_instructions(config)
    if call_mgmt_instructions:
        instructions.append(f"\nCALL MANAGEMENT:\n{call_mgmt_instructions}")
    
    return "\n".join(instructions)
