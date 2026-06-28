<?php
defined('MOODLE_INTERNAL') || die();

class qtype_tsumeshogi_question extends question_graded_by_strategy
        implements question_response_answer_comparer {

    /** @var string SFEN board position */
    public $sfen;

    /** @var string Correct USI move e.g. "S*5b" or "5a4b" */
    public $correctanswer;

    public function __construct() {
        parent::__construct(new question_first_matching_answer_grading_strategy($this));
    }

    public function get_expected_data() {
        return ['answer' => PARAM_RAW_TRIMMED];
    }

    public function summarise_response(array $response) {
        return $response['answer'] ?? null;
    }

    public function is_complete_response(array $response) {
        return isset($response['answer']) && $response['answer'] !== '';
    }

    public function get_validation_error(array $response) {
        if (!$this->is_complete_response($response)) {
            return get_string('pleaseenterananswer', 'qtype_tsumeshogi');
        }
        return '';
    }

    public function is_same_response(array $prevresponse, array $newresponse) {
        return question_utils::arrays_same_at_key_missing_is_blank(
            $prevresponse, $newresponse, 'answer'
        );
    }

    /**
     * Compare submitted answer with the correct USI move (case-insensitive).
     */
    public function compare_response_with_answer(array $response, question_answer $answer) {
        $submitted = strtolower(trim($response['answer'] ?? ''));
        $correct   = strtolower(trim($answer->answer));
        return $submitted === $correct;
    }

    public function get_answers() {
        return [
            new question_answer(1, $this->correctanswer, 1.0, '', FORMAT_HTML),
        ];
    }
}
